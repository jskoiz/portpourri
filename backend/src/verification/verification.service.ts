import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

    // Scaffold only: return code in response until real provider integrations exist.
    return {
      started: true,
      channel,
      maskedTarget: this.maskTarget(channel, target),
      devCode: code,
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `confirm failed for userId=${userId}, channel=${channel}: ${message}`,
      );
      throw error;
    }

    return { verified: true };
  }

  async status(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          hasVerifiedEmail: true,
          hasVerifiedPhone: true,
          email: true,
          phoneNumber: true,
        },
      });

      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `status failed for userId=${userId}: ${message}`,
      );
      throw error;
    }
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
