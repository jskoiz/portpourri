import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { appConfig } from '../config/app.config';

/** Verification code lives for 10 minutes (in seconds for Redis TTL). */
const VERIFICATION_TTL_S = 10 * 60;
/** Minimum value (inclusive) for a 6-digit verification code. */
const CODE_MIN = 100_000;
/** Maximum value (exclusive) for a 6-digit verification code. */
const CODE_MAX = 1_000_000;
/** Maximum wrong-code attempts before a pending challenge is discarded. */
const MAX_CONFIRM_ATTEMPTS = 5;
/** Redis key prefix for verification codes. */
const KEY_PREFIX = 'verification:';

interface PendingVerification {
  userId: string;
  channel: 'email' | 'phone';
  target: string;
  code: string;
  expiresAt: number; // epoch ms – kept for compatibility with confirm logic
  attemptsRemaining: number;
}

@Injectable()
export class VerificationService implements OnModuleDestroy {
  private readonly logger = new Logger(VerificationService.name);
  private readonly redis: Redis;

  constructor(private readonly prisma: PrismaService) {
    this.redis = new Redis({
      host: appConfig.redis.host,
      port: appConfig.redis.port,
      // Avoid noisy reconnect logs in test environments
      lazyConnect: appConfig.environment === 'test',
    });
  }

  /** Allow injecting a mock/test Redis instance. */
  static createWithRedis(prisma: PrismaService, redis: Redis): VerificationService {
    const svc = new VerificationService(prisma);
    // Replace the auto-created Redis instance with the provided one
    (svc as unknown as { redis: Redis }).redis = redis;
    return svc;
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  private redisKey(userId: string, channel: string): string {
    return `${KEY_PREFIX}${userId}:${channel}`;
  }

  private async getPending(key: string): Promise<PendingVerification | null> {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as PendingVerification;
  }

  private async setPending(key: string, data: PendingVerification): Promise<void> {
    // Compute remaining TTL from expiresAt so we don't extend the window
    const remainingMs = data.expiresAt - Date.now();
    if (remainingMs <= 0) {
      await this.redis.del(key);
      return;
    }
    const remainingS = Math.ceil(remainingMs / 1000);
    await this.redis.set(key, JSON.stringify(data), 'EX', remainingS);
  }

  async start(userId: string, channel: 'email' | 'phone', target: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        phoneNumber: true,
        hasVerifiedEmail: true,
        hasVerifiedPhone: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const normalizedTarget =
      channel === 'email' ? target.trim().toLowerCase() : target.trim();
    const storedTarget =
      channel === 'email'
        ? user.email?.trim().toLowerCase()
        : user.phoneNumber?.trim();

    if (!normalizedTarget || !storedTarget || storedTarget !== normalizedTarget) {
      throw new BadRequestException('Verification target does not match your account');
    }

    const alreadyVerified =
      channel === 'email' ? user.hasVerifiedEmail : user.hasVerifiedPhone;
    if (alreadyVerified) {
      throw new BadRequestException('Verification is already complete');
    }

    const code = randomInt(CODE_MIN, CODE_MAX).toString();
    const key = this.redisKey(userId, channel);
    const pending: PendingVerification = {
      userId,
      channel,
      target: normalizedTarget,
      code,
      expiresAt: Date.now() + VERIFICATION_TTL_S * 1000,
      attemptsRemaining: MAX_CONFIRM_ATTEMPTS,
    };
    await this.redis.set(key, JSON.stringify(pending), 'EX', VERIFICATION_TTL_S);

    // In production, dispatch via real SMS/email provider and never return the code.
    const isDev = !appConfig.isProduction;
    return {
      started: true,
      channel,
      maskedTarget: this.maskTarget(channel, normalizedTarget),
      ...(isDev ? { devCode: code } : {}),
    };
  }

  async confirm(userId: string, channel: 'email' | 'phone', code: string) {
    const key = this.redisKey(userId, channel);
    const pending = await this.getPending(key);

    if (!pending || pending.expiresAt < Date.now()) {
      if (pending) {
        await this.redis.del(key);
      }
      return { verified: false };
    }

    if (pending.code !== code) {
      if (pending.attemptsRemaining <= 1) {
        await this.redis.del(key);
      } else {
        await this.setPending(key, {
          ...pending,
          attemptsRemaining: pending.attemptsRemaining - 1,
        });
      }
      return { verified: false };
    }

    // Delete the pending entry atomically before doing the DB update
    // to prevent concurrent confirmations.
    const deleted = await this.redis.del(key);
    if (deleted === 0) {
      // Another concurrent request already consumed it
      return { verified: false };
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          phoneNumber: true,
        },
      });

      if (!user) {
        // Restore the pending entry so the code can be retried
        await this.setPending(key, pending);
        throw new NotFoundException('User not found');
      }

      const storedTarget =
        channel === 'email'
          ? user.email?.trim().toLowerCase()
          : user.phoneNumber?.trim();
      const pendingTarget =
        channel === 'email'
          ? pending.target.trim().toLowerCase()
          : pending.target.trim();

      if (!storedTarget || storedTarget !== pendingTarget) {
        // Restore pending so the user can retry after fixing their profile
        await this.setPending(key, pending);
        return { verified: false };
      }

      if (channel === 'email') {
        await this.prisma.user.update({
          where: { id: userId },
          data: { hasVerifiedEmail: true },
        });
      } else {
        await this.prisma.user.update({
          where: { id: userId },
          data: { hasVerifiedPhone: true },
        });
      }

      return { verified: true };
    } catch (error: unknown) {
      // Restore pending entry on transient failures so the code can be retried
      await this.setPending(key, pending);
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async status(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        hasVerifiedEmail: true,
        hasVerifiedPhone: true,
        email: true,
        phoneNumber: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private maskTarget(channel: 'email' | 'phone', target: string) {
    if (channel === 'email') {
      const [name, domain] = target.split('@');
      if (!domain) return '***';
      return `${name.slice(0, 1)}***@${domain}`;
    }

    return `***${target.slice(-2)}`;
  }
}
