import { NotificationType } from '../common/enums';

export type NotificationPreferenceKey =
  | 'matches'
  | 'messages'
  | 'likes'
  | 'eventReminders'
  | 'eventRsvps'
  | 'system';

export interface NotificationTypeMetadata {
  preferenceKey: NotificationPreferenceKey;
  pushEligible: boolean;
  requiredDataKeys: readonly string[];
}

export const NOTIFICATION_TYPE_METADATA: Record<
  NotificationType,
  NotificationTypeMetadata
> = {
  [NotificationType.LikeReceived]: {
    preferenceKey: 'likes',
    pushEligible: true,
    requiredDataKeys: ['fromUserId'],
  },
  [NotificationType.MatchCreated]: {
    preferenceKey: 'matches',
    pushEligible: true,
    requiredDataKeys: ['matchId', 'withUserId'],
  },
  [NotificationType.MessageReceived]: {
    preferenceKey: 'messages',
    pushEligible: true,
    requiredDataKeys: ['matchId', 'senderId'],
  },
  [NotificationType.EventRsvp]: {
    preferenceKey: 'eventRsvps',
    pushEligible: true,
    requiredDataKeys: ['eventId', 'attendeeId'],
  },
  [NotificationType.EventInvite]: {
    preferenceKey: 'eventReminders',
    pushEligible: true,
    requiredDataKeys: ['eventId', 'matchId', 'withUserId'],
  },
  [NotificationType.EventReminder]: {
    preferenceKey: 'eventReminders',
    pushEligible: false,
    requiredDataKeys: ['eventId'],
  },
  [NotificationType.System]: {
    preferenceKey: 'system',
    pushEligible: false,
    requiredDataKeys: [],
  },
};

export interface LikeReceivedNotificationData {
  fromUserId: string;
}

export interface MatchCreatedNotificationData {
  matchId: string;
  withUserId: string;
}

export interface MessageReceivedNotificationData {
  matchId: string;
  senderId: string;
}

export interface EventRsvpNotificationData {
  eventId: string;
  attendeeId: string;
}

export interface EventInviteNotificationData {
  eventId: string;
  matchId: string;
  inviterId: string;
  withUserId: string;
}

export interface EventReminderNotificationData {
  eventId: string;
}

export interface NotificationDataByType {
  [NotificationType.LikeReceived]: LikeReceivedNotificationData;
  [NotificationType.MatchCreated]: MatchCreatedNotificationData;
  [NotificationType.MessageReceived]: MessageReceivedNotificationData;
  [NotificationType.EventRsvp]: EventRsvpNotificationData;
  [NotificationType.EventInvite]: EventInviteNotificationData;
  [NotificationType.EventReminder]: EventReminderNotificationData;
  [NotificationType.System]: Record<string, unknown> | undefined;
}

export interface NotificationTemplatePayload<
  TType extends NotificationType = NotificationType,
> {
  type: TType;
  title: string;
  body: string;
  data?: NotificationDataByType[TType];
  /** When set, notification is suppressed if recipient blocked this user. */
  sourceUserId?: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function normalizeNotificationData(
  type: NotificationType,
  data?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...(data ?? {}),
    type,
  };
}

export function getNotificationPayloadIssues(
  type: NotificationType,
  data?: Record<string, unknown>,
): string[] {
  const normalized = normalizeNotificationData(type, data);
  const metadata = NOTIFICATION_TYPE_METADATA[type];

  return metadata.requiredDataKeys.filter((key) => !isNonEmptyString(normalized[key]));
}
