import type { AppNotification, DiscoveryUser, Match } from '../../api/types';

const blockedUserIds = new Set<string>();

function normalizeUserId(userId: string) {
  return userId.trim();
}

export function registerBlockedUserId(userId: string) {
  const normalized = normalizeUserId(userId);
  if (normalized) {
    blockedUserIds.add(normalized);
  }
}

export function clearBlockedUserIds() {
  blockedUserIds.clear();
}

export function isBlockedUserId(userId?: string | null) {
  if (!userId) return false;
  const normalized = normalizeUserId(userId);
  return Boolean(normalized && blockedUserIds.has(normalized));
}

export function filterBlockedDiscoveryUsers(users: DiscoveryUser[]) {
  return users.filter((user) => !isBlockedUserId(user.id));
}

export function filterBlockedMatches(matches: Match[]) {
  return matches.filter((match) => !isBlockedUserId(match.user.id));
}

function getNotificationTargetIds(notification: AppNotification) {
  const data = notification.data as Record<string, unknown> | undefined;
  const targetKeys = [
    'blockedUserId',
    'fromUserId',
    'reportedUserId',
    'senderId',
    'targetUserId',
    'userId',
    'withUserId',
  ];

  return targetKeys
    .map((key) => data?.[key])
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
}

export function notificationReferencesBlockedUser(notification: AppNotification) {
  return getNotificationTargetIds(notification).some((userId) => isBlockedUserId(userId));
}

export function filterBlockedNotifications(notifications: AppNotification[]) {
  return notifications.filter((notification) => !notificationReferencesBlockedUser(notification));
}
