import { Injectable } from '@nestjs/common';

export type NotificationType =
  | 'like_received'
  | 'match_created'
  | 'message_received'
  | 'event_rsvp'
  | 'event_reminder'
  | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class NotificationsService {
  private readonly notificationsByUser = new Map<string, AppNotification[]>();

  create(
    userId: string,
    payload: Omit<AppNotification, 'id' | 'userId' | 'readAt' | 'createdAt'>,
  ) {
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      userId,
      readAt: null,
      createdAt: new Date(),
      ...payload,
    };

    const current = this.notificationsByUser.get(userId) ?? [];
    current.unshift(notification);
    this.notificationsByUser.set(userId, current.slice(0, 200));

    // Foundation hook for future APNS/FCM dispatch
    this.dispatchPush(notification);

    return notification;
  }

  list(userId: string) {
    return this.notificationsByUser.get(userId) ?? [];
  }

  markRead(userId: string, notificationId: string) {
    const current = this.notificationsByUser.get(userId) ?? [];
    const target = current.find((n) => n.id === notificationId);
    if (target && !target.readAt) {
      target.readAt = new Date();
    }
    return target ?? null;
  }

  markAllRead(userId: string) {
    const current = this.notificationsByUser.get(userId) ?? [];
    const now = new Date();
    for (const item of current) {
      if (!item.readAt) item.readAt = now;
    }
    return { updated: current.length };
  }

  private dispatchPush(notification: AppNotification) {
    // Intentionally a no-op for now.
    // Future implementation: route to APNS/FCM + device token store.
    void notification;
  }
}
