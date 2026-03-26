import client from '../../api/client';
import type { AppNotification } from '../../api/types';
import { withErrorLogging } from './shared';

export interface NotificationPreferences {
  matches: boolean;
  messages: boolean;
  likes: boolean;
  eventReminders: boolean;
  eventRsvps: boolean;
  system: boolean;
}

export const notificationsApi = {
  list: async () =>
    withErrorLogging('notifications', 'list', () =>
      client.get<AppNotification[]>('/notifications'),
    ),
  markRead: async (id: string) =>
    withErrorLogging('notifications', 'markRead', () =>
      client.patch<AppNotification | null>(`/notifications/${id}/read`),
      { id },
    ),
  markAllRead: async () =>
    withErrorLogging('notifications', 'markAllRead', () =>
      client.post<{ updated: number }>('/notifications/mark-all-read'),
    ),
  getPreferences: async () =>
    withErrorLogging('notifications', 'getPreferences', () =>
      client.get<NotificationPreferences>('/notifications/preferences'),
    ),
  updatePreferences: async (prefs: Partial<NotificationPreferences>) =>
    withErrorLogging('notifications', 'updatePreferences', () =>
      client.put<NotificationPreferences>('/notifications/preferences', prefs),
    ),
};
