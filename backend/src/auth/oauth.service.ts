import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { appConfig } from '../config/app.config';
import { issueAuthToken } from './auth.token-factory';
import type { AuthResult } from './auth.types';
import * as crypto from 'crypto';
import * as https from 'https';

const APPLE_JWKS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const APPLE_JWKS_FETCH_TIMEOUT_MS = 5_000;

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private readonly googleClient: OAuth2Client;
  private appleKeysCache: {
    keys: Array<{ kid: string; [key: string]: unknown }>;
    fetchedAt: number;
  } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(
      appConfig.oauth.google.clientId ?? undefined,
    );
  }

  async loginWithGoogle(idToken: string): Promise<AuthResult> {
    const payload = await this.verifyGoogleToken(idToken);
    return this.findOrCreateOAuthUser({
      provider: AuthProvider.GOOGLE,
      providerId: payload.sub,
      email: payload.email ?? null,
      firstName: payload.given_name ?? payload.name ?? 'User',
    });
  }

  async loginWithApple(
    identityToken: string,
    fullName?: string,
  ): Promise<AuthResult> {
    const payload = await this.verifyAppleToken(identityToken);
    return this.findOrCreateOAuthUser({
      provider: AuthProvider.APPLE,
      providerId: payload.sub,
      email: payload.email ?? null,
      firstName: fullName ?? 'User',
    });
  }

  private async verifyGoogleToken(idToken: string) {
    if (!appConfig.oauth.google.clientId) {
      throw new UnauthorizedException(
        'Google Sign In is not configured (GOOGLE_CLIENT_ID missing)',
      );
    }
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: appConfig.oauth.google.clientId,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid Google token');
      }
      return payload;
    } catch (error) {
      this.logger.warn(
        `Google token verification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  private async verifyAppleToken(
    identityToken: string,
  ): Promise<{ sub: string; email?: string }> {
    try {
      // Decode the JWT header to get the kid
      const [headerB64] = identityToken.split('.');
      const header = JSON.parse(
        Buffer.from(headerB64, 'base64url').toString(),
      );

      // Fetch Apple's public keys
      const appleKeys = await this.fetchApplePublicKeys();
      const matchingKey = appleKeys.keys.find(
        (k: { kid: string }) => k.kid === header.kid,
      );
      if (!matchingKey) {
        throw new UnauthorizedException(
          'Invalid Apple token: key not found',
        );
      }

      // Verify the JWT using Node's crypto
      const publicKey = crypto.createPublicKey({
        key: matchingKey,
        format: 'jwk',
      });
      const [, payloadB64, signatureB64] = identityToken.split('.');
      const signedData = `${headerB64}.${payloadB64}`;
      const signature = Buffer.from(signatureB64, 'base64url');

      const isValid = crypto.verify(
        'RSA-SHA256',
        Buffer.from(signedData),
        publicKey,
        signature,
      );

      if (!isValid) {
        throw new UnauthorizedException(
          'Invalid Apple token: signature verification failed',
        );
      }

      const payload = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString(),
      );

      // Validate issuer and audience
      if (payload.iss !== 'https://appleid.apple.com') {
        throw new UnauthorizedException(
          'Invalid Apple token: wrong issuer',
        );
      }
      // Always enforce audience — reject tokens minted for other apps
      const expectedAudience = appConfig.oauth.apple.clientId;
      if (!expectedAudience) {
        throw new UnauthorizedException(
          'Apple Sign In is not configured (APPLE_CLIENT_ID missing)',
        );
      }
      if (payload.aud !== expectedAudience) {
        throw new UnauthorizedException(
          'Invalid Apple token: wrong audience',
        );
      }
      // Check expiry
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new UnauthorizedException(
          'Invalid Apple token: expired',
        );
      }

      if (!payload.sub) {
        throw new UnauthorizedException(
          'Invalid Apple token: missing subject',
        );
      }

      return { sub: payload.sub, email: payload.email };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.warn(
        `Apple token verification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException('Invalid Apple token');
    }
  }

  private async fetchApplePublicKeys(): Promise<{
    keys: Array<{ kid: string; [key: string]: unknown }>;
  }> {
    // Return cached keys if still fresh
    if (
      this.appleKeysCache &&
      Date.now() - this.appleKeysCache.fetchedAt < APPLE_JWKS_CACHE_TTL_MS
    ) {
      return this.appleKeysCache;
    }

    const result = await new Promise<{
      keys: Array<{ kid: string; [key: string]: unknown }>;
    }>((resolve, reject) => {
      const req = https
        .get('https://appleid.apple.com/auth/keys', (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        })
        .on('error', reject);

      req.setTimeout(APPLE_JWKS_FETCH_TIMEOUT_MS, () => {
        req.destroy(new Error('Apple JWKS fetch timed out'));
      });
    });

    this.appleKeysCache = { ...result, fetchedAt: Date.now() };
    return result;
  }

  private async findOrCreateOAuthUser(params: {
    provider: AuthProvider;
    providerId: string;
    email: string | null;
    firstName: string;
  }): Promise<AuthResult> {
    const { provider, providerId, email, firstName } = params;

    // Check for banned/deleted users first
    const existing = await this.prisma.user.findFirst({
      where: {
        authProvider: provider,
        providerId,
      },
      select: { id: true, isDeleted: true, isBanned: true },
    });

    if (existing?.isBanned) {
      throw new UnauthorizedException('Account is suspended');
    }
    if (existing?.isDeleted) {
      throw new UnauthorizedException('Account has been deleted');
    }

    // Atomic upsert — prevents race condition with concurrent sign-ins
    const user = await this.prisma.user.upsert({
      where: {
        authProvider_providerId: { authProvider: provider, providerId },
      },
      update: {}, // Returning user — nothing to change
      create: {
        email: email?.toLowerCase() ?? null,
        authProvider: provider,
        providerId,
        firstName,
        // Placeholder birthdate — user completes during onboarding
        birthdate: new Date('2000-01-01'),
        gender: 'MALE', // Default — user updates during onboarding
        isOnboarded: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        isOnboarded: true,
      },
    });

    this.logger.log(
      `OAuth ${existing ? 'login' : 'signup'}: userId=${user.id} provider=${provider}`,
    );
    return issueAuthToken(this.jwtService, user);
  }
}
