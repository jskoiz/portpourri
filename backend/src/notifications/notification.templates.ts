import { NotificationType } from '../common/enums';
import type {
  EventInviteNotificationData,
  EventReminderNotificationData,
  EventRsvpNotificationData,
  LikeReceivedNotificationData,
  MatchCreatedNotificationData,
  NotificationTemplatePayload,
} from './notification.contracts';

export function buildLikeReceivedNotification(
  fromUserId: string,
): NotificationTemplatePayload<NotificationType.LikeReceived> {
  return {
    type: NotificationType.LikeReceived,
    title: 'New like',
    body: 'Someone liked your profile.',
    data: { fromUserId } satisfies LikeReceivedNotificationData,
    sourceUserId: fromUserId,
  };
}

export function buildMatchCreatedNotification(
  matchId: string,
  withUserId: string,
): NotificationTemplatePayload<NotificationType.MatchCreated> {
  return {
    type: NotificationType.MatchCreated,
    title: "It's a match!",
    body: 'You can start chatting now.',
    data: { matchId, withUserId } satisfies MatchCreatedNotificationData,
    sourceUserId: withUserId,
  };
}

export function buildEventRsvpNotification(
  eventId: string,
  attendeeId: string,
  eventTitle: string,
): NotificationTemplatePayload<NotificationType.EventRsvp> {
  return {
    type: NotificationType.EventRsvp,
    title: 'New RSVP',
    body: `Someone joined ${eventTitle}`,
    data: { eventId, attendeeId } satisfies EventRsvpNotificationData,
    sourceUserId: attendeeId,
  };
}

export function buildEventInviteNotification(
  eventId: string,
  inviterId: string,
  inviterName: string,
  eventTitle: string,
  matchId: string,
): NotificationTemplatePayload<NotificationType.EventInvite> {
  return {
    type: NotificationType.EventInvite,
    title: 'Event invite',
    body: `${inviterName} invited you to ${eventTitle}`,
    data: {
      eventId,
      matchId,
      inviterId,
      withUserId: inviterId,
    } satisfies EventInviteNotificationData,
    sourceUserId: inviterId,
  };
}

export function buildEventReminderNotification(
  eventId: string,
  eventTitle: string,
): NotificationTemplatePayload<NotificationType.EventReminder> {
  return {
    type: NotificationType.EventReminder,
    title: 'Event joined',
    body: `You are in for ${eventTitle}`,
    data: { eventId } satisfies EventReminderNotificationData,
  };
}
