import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './push.service';
import type { Notification } from '@prisma/client';

export type NotificationType =
  | 'like_received'
  | 'match_created'
  | 'message_received'
  | 'event_rsvp'
  | 'event_reminder'
  | 'system';

/** Notification types that should trigger a push notification. */
const PUSH_ELIGIBLE_TYPES: ReadonlySet<NotificationType> = new Set([
  'match_created',
  'message_received',
  'like_received',
  'event_rsvp',
]);

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
  ) {}

  async create(
    userId: string,
    payload: {
      type: NotificationType;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    },
  ): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: (payload.data as Prisma.InputJsonValue) ?? undefined,
      },
    });

    // Foundation hook for future APNS/FCM dispatch
    this.dispatchPush(notification);

    return notification;
  }

  async list(
    userId: string,
    take = 50,
    cursor?: string,
  ): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(take, 100),
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor },
          }
        : {}),
    });
  }

  async markRead(
    userId: string,
    notificationId: string,
  ): Promise<Notification> {
    const existing = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!existing) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    if (existing.read) {
      return existing;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });

    return { updated: result.count };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  private async dispatchPush(notification: Notification): Promise<void> {
    if (!PUSH_ELIGIBLE_TYPES.has(notification.type as NotificationType)) {
      return;
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: notification.userId },
        select: { pushToken: true },
      });

      if (!user?.pushToken) {
        return;
      }

      await this.pushService.sendPushNotification(
        user.pushToken,
        notification.title,
        notification.body,
        (notification.data as Record<string, unknown>) ?? undefined,
      );
    } catch (error) {
      this.logger.error(
        `Failed to dispatch push for notification ${notification.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
