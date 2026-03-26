import type { AppNotification } from '../../api/types';
import {
  getNotificationBodyFallback as getNotificationBodyFallbackFromRegistry,
  getNotificationMeta as getNotificationMetaFromRegistry,
  getNotificationTitleFallback as getNotificationTitleFallbackFromRegistry,
} from './notificationNavigation';

export type NotificationSectionTitle = 'Today' | 'Yesterday' | 'Earlier';

export function getNotificationMeta(type: AppNotification['type']) {
  return getNotificationMetaFromRegistry(type);
}

function getNotificationTimestamp(value: string | Date) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function getNotificationTitleFallback(type: AppNotification['type']) {
  return getNotificationTitleFallbackFromRegistry(type);
}

export function getNotificationBodyFallback(type: AppNotification['type']) {
  return getNotificationBodyFallbackFromRegistry(type);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getNotificationGroup(
  dateValue: string | Date | null | undefined,
): NotificationSectionTitle {
  if (dateValue == null) return 'Earlier';

  const createdAt = new Date(dateValue);
  if (Number.isNaN(createdAt.getTime())) return 'Earlier';
  const now = new Date();

  if (isSameDay(createdAt, now)) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  return isSameDay(createdAt, yesterday) ? 'Yesterday' : 'Earlier';
}

export function sortNotificationsForDisplay(notifications: AppNotification[]) {
  return [...notifications].sort((a, b) => {
    const timeA = getNotificationTimestamp(a.createdAt);
    const timeB = getNotificationTimestamp(b.createdAt);

    if (timeA !== timeB) return timeB - timeA;

    return a.id.localeCompare(b.id);
  });
}

export function buildNotificationSections(notifications: AppNotification[]) {
  const groups = sortNotificationsForDisplay(notifications).reduce(
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
