import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, ReportCategory } from '@prisma/client';
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

/**
 * Maps notification types to the corresponding preference field name
 * on the NotificationPreferences model.
 */
const TYPE_TO_PREFERENCE_KEY: Record<NotificationType, string> = {
  match_created: 'matches',
  message_received: 'messages',
  like_received: 'likes',
  event_rsvp: 'eventRsvps',
  event_reminder: 'eventReminders',
  system: 'system',
};

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
      /** When set, the notification is suppressed if recipient has blocked this user. */
      sourceUserId?: string;
    },
  ): Promise<Notification | null> {
    // Suppress notification if recipient and source are in a block relationship
    if (payload.sourceUserId) {
      const blocked = await this.isBlockedPair(userId, payload.sourceUserId);
      if (blocked) {
        this.logger.debug(
          `Suppressing ${payload.type} notification to ${userId} — blocked by/blocking ${payload.sourceUserId}`,
        );
        return null;
      }
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: (payload.data as Prisma.InputJsonValue) ?? undefined,
      },
    });

    // Fire-and-forget push dispatch
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

  /**
   * Lightweight block-pair check to avoid circular dependency with ModerationModule.
   * Checks blocked matches and BLOCK-category reports.
   */
  private async isBlockedPair(
    userA: string,
    userB: string,
  ): Promise<boolean> {
    const [sortedA, sortedB] = [userA, userB].sort();
    const blockedMatch = await this.prisma.match.findFirst({
      where: { userAId: sortedA, userBId: sortedB, isBlocked: true },
      select: { id: true },
    });
    if (blockedMatch) return true;

    const blockReport = await this.prisma.report.findFirst({
      where: {
        category: ReportCategory.BLOCK,
        OR: [
          { reporterId: userA, reportedUserId: userB },
          { reporterId: userB, reportedUserId: userA },
        ],
      },
      select: { id: true },
    });
    return !!blockReport;
  }

  /**
   * Check if the user has opted in to push notifications for the given type.
   * Returns true when no preferences row exists (all defaults are true).
   */
  async isNotificationEnabled(
    userId: string,
    type: NotificationType,
  ): Promise<boolean> {
    const prefs = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    if (!prefs) return true;

    const key = TYPE_TO_PREFERENCE_KEY[type];
    if (!key) return true;

    return (prefs as Record<string, unknown>)[key] !== false;
  }

  private async dispatchPush(notification: Notification): Promise<void> {
    if (!PUSH_ELIGIBLE_TYPES.has(notification.type as NotificationType)) {
      return;
    }

    try {
      // Single query: fetch pushToken and preferences together
      const user = await this.prisma.user.findUnique({
        where: { id: notification.userId },
        select: {
          pushToken: true,
          notificationPreferences: true,
        },
      });

      if (!user?.pushToken) {
        return;
      }

      // Check user notification preferences before sending
      const prefKey = TYPE_TO_PREFERENCE_KEY[notification.type as NotificationType];
      if (
        prefKey &&
        user.notificationPreferences &&
        (user.notificationPreferences as Record<string, unknown>)[prefKey] === false
      ) {
        this.logger.debug(
          `Push skipped — user opted out type=${notification.type} userId=${notification.userId}`,
        );
        return;
      }

      const result = await this.pushService.sendPushNotification(
        user.pushToken,
        notification.title,
        notification.body,
        (notification.data as Record<string, unknown>) ?? undefined,
      );

      this.logger.debug(
        `Push dispatch complete — outcome=${result.outcome} notificationId=${notification.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to dispatch push for notification ${notification.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
