import type { AppNotification } from '../../api/types';

export type NotificationSectionTitle = 'Today' | 'Yesterday' | 'Earlier';

export function getNotificationMeta(type: AppNotification['type']) {
  switch (type) {
    case 'match_created':
    case 'like_received':
      return { icon: 'heart' as const, color: '#C4A882' };
    case 'message_received':
      return { icon: 'message-square' as const, color: '#8BAA7A' };
    case 'event_rsvp':
      return { icon: 'users' as const, color: '#C4A882' };
    case 'event_reminder':
      return { icon: 'calendar' as const, color: '#8BAA7A' };
    default:
      return { icon: 'bell' as const, color: '#B8A9C4' };
  }
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getNotificationGroup(dateValue: string | Date): NotificationSectionTitle {
  const createdAt = new Date(dateValue);
  const now = new Date();

  if (isSameDay(createdAt, now)) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  return isSameDay(createdAt, yesterday) ? 'Yesterday' : 'Earlier';
}

export function buildNotificationSections(notifications: AppNotification[]) {
  const groups = notifications.reduce(
    (accumulator, notification) => {
      const group = getNotificationGroup(notification.createdAt);
      accumulator[group].push(notification);
      return accumulator;
    },
    {
      Today: [] as AppNotification[],
      Yesterday: [] as AppNotification[],
      Earlier: [] as AppNotification[],
    },
  );

  return (Object.keys(groups) as NotificationSectionTitle[])
    .filter((title) => groups[title].length > 0)
    .map((title) => ({ title, data: groups[title] }));
}
