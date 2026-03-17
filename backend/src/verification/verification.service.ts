import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { appConfig } from '../config/app.config';

interface PendingVerification {
  userId: string;
  channel: 'email' | 'phone';
  target: string;
  code: string;
  expiresAt: Date;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  // TODO: Replace in-memory Map with Redis or database for horizontal scaling
  private pending = new Map<string, PendingVerification>();

  constructor(private readonly prisma: PrismaService) {}

  start(userId: string, channel: 'email' | 'phone', target: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `${userId}:${channel}`;
    this.pending.set(key, {
      userId,
      channel,
      target,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // In production, dispatch via real SMS/email provider and never return the code.
    const isDev = !appConfig.isProduction;
    return {
      started: true,
      channel,
      maskedTarget: this.maskTarget(channel, target),
      ...(isDev ? { devCode: code } : {}),
    };
  }

  async confirm(userId: string, channel: 'email' | 'phone', code: string) {
    const key = `${userId}:${channel}`;
    const pending = this.pending.get(key);

    if (
      !pending ||
      pending.expiresAt.getTime() < Date.now() ||
      pending.code !== code
    ) {
      return { verified: false };
    }

    // Delete before awaiting to prevent a concurrent request with the same
    // code from also passing the guard and double-verifying.
    this.pending.delete(key);

    try {
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
    } catch (error: unknown) {
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

    return { verified: true };
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
