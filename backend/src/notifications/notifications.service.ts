import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, ReportCategory } from '@prisma/client';
import { NotificationType } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './push.service';
import {
  getNotificationPayloadIssues,
  normalizeNotificationData,
  NOTIFICATION_TYPE_METADATA,
  NotificationTemplatePayload,
} from './notification.contracts';
import type { Notification } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
  ) {}

  async create(
    userId: string,
    payload: NotificationTemplatePayload,
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

    const normalizedData = normalizeNotificationData(payload.type, payload.data);
    const payloadIssues = getNotificationPayloadIssues(payload.type, normalizedData);
    if (payloadIssues.length > 0) {
      this.logger.warn(
        `Notification payload incomplete type=${payload.type} userId=${userId} missing=${payloadIssues.join(',')}`,
      );
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: normalizedData as Prisma.InputJsonValue,
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

    const key = NOTIFICATION_TYPE_METADATA[type].preferenceKey;
    return (prefs as Record<string, unknown>)[key] !== false;
  }

  private async dispatchPush(notification: Notification): Promise<void> {
    const metadata = NOTIFICATION_TYPE_METADATA[notification.type as NotificationType];

    if (!metadata) {
      this.logger.warn(
        `Push skipped — unsupported notification type=${notification.type} notificationId=${notification.id}`,
      );
      return;
    }

    if (!metadata.pushEligible) {
      this.logger.debug(
        `Push skipped — non-push type=${notification.type} notificationId=${notification.id}`,
      );
      return;
    }

    const normalizedData = normalizeNotificationData(
      notification.type as NotificationType,
      (notification.data as Record<string, unknown> | null) ?? undefined,
    );
    const payloadIssues = getNotificationPayloadIssues(
      notification.type as NotificationType,
      normalizedData,
    );
    if (payloadIssues.length > 0) {
      this.logger.warn(
        `Push skipped — malformed payload type=${notification.type} notificationId=${notification.id} missing=${payloadIssues.join(',')}`,
      );
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
        this.logger.debug(
          `Push skipped — missing token type=${notification.type} userId=${notification.userId}`,
        );
        return;
      }

      // Check user notification preferences before sending
      if (
        user.notificationPreferences &&
        (user.notificationPreferences as Record<string, unknown>)[
          metadata.preferenceKey
        ] === false
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
        {
          notificationId: notification.id,
          ...normalizedData,
        },
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
