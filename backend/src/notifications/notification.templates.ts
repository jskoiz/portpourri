import type { NotificationType } from './notifications.service';

export interface NotificationTemplatePayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export function buildLikeReceivedNotification(
  fromUserId: string,
): NotificationTemplatePayload {
  return {
    type: 'like_received',
    title: 'New like',
    body: 'Someone liked your profile.',
    data: { fromUserId },
  };
}

export function buildMatchCreatedNotification(
  matchId: string,
  withUserId: string,
): NotificationTemplatePayload {
  return {
    type: 'match_created',
    title: "It's a match!",
    body: 'You can start chatting now.',
    data: { matchId, withUserId },
  };
}

export function buildEventRsvpNotification(
  eventId: string,
  attendeeId: string,
  eventTitle: string,
): NotificationTemplatePayload {
  return {
    type: 'event_rsvp',
    title: 'New RSVP',
    body: `Someone joined ${eventTitle}`,
    data: { eventId, attendeeId },
  };
}

export function buildEventReminderNotification(
  eventId: string,
  eventTitle: string,
): NotificationTemplatePayload {
  return {
    type: 'event_reminder',
    title: 'Event joined',
    body: `You are in for ${eventTitle}`,
    data: { eventId },
  };
}
