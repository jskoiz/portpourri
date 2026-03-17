import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { appConfig } from '../config/app.config';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Extract JWT from Authorization Bearer header first, then fall back to the
 * `token` query parameter. The query-param fallback is needed for SSE
 * connections (EventSource) which do not support custom request headers.
 */
function extractJwt(req: Request): string | null {
  const fromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (fromHeader) return fromHeader;

  const queryToken = req.query?.token;
  if (typeof queryToken === 'string' && queryToken.length > 0) {
    return queryToken;
  }

  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: { query?: Record<string, unknown> } | undefined) => {
          const token = request?.query?.token;
          return typeof token === 'string' && token.trim() ? token : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: appConfig.jwt.secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, isDeleted: false, isBanned: false },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer valid');
    }

    return user;
  }
}
