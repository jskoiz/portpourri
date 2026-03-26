import {
  buildEventReminderNotification,
  buildEventInviteNotification,
  buildEventRsvpNotification,
  buildLikeReceivedNotification,
  buildMatchCreatedNotification,
} from './notification.templates';
import { NotificationType } from '../common/enums';

describe('notification templates', () => {
  it('builds like notifications with fromUserId payload', () => {
    expect(buildLikeReceivedNotification('user-1')).toEqual({
      type: NotificationType.LikeReceived,
      title: 'New like',
      body: 'Someone liked your profile.',
      data: { fromUserId: 'user-1' },
      sourceUserId: 'user-1',
    });
  });

  it('builds match notifications with match and counterpart ids', () => {
    expect(buildMatchCreatedNotification('match-1', 'user-2')).toEqual({
      type: NotificationType.MatchCreated,
      title: "It's a match!",
      body: 'You can start chatting now.',
      data: { matchId: 'match-1', withUserId: 'user-2' },
      sourceUserId: 'user-2',
    });
  });

  it('builds event RSVP notifications with event and attendee ids', () => {
    expect(buildEventRsvpNotification('event-1', 'user-3', 'Sunrise Run')).toEqual({
      type: NotificationType.EventRsvp,
      title: 'New RSVP',
      body: 'Someone joined Sunrise Run',
      data: { eventId: 'event-1', attendeeId: 'user-3' },
      sourceUserId: 'user-3',
    });
  });

  it('builds event invite notifications with source and variant data', () => {
    expect(
      buildEventInviteNotification(
        'event-1',
        'user-4',
        'Mia',
        'Sunrise Run',
        'match-2',
      ),
    ).toEqual({
      type: NotificationType.EventInvite,
      title: 'Event invite',
      body: 'Mia invited you to Sunrise Run',
      data: {
        eventId: 'event-1',
        matchId: 'match-2',
        inviterId: 'user-4',
        withUserId: 'user-4',
      },
      sourceUserId: 'user-4',
    });
  });

  it('builds event reminder notifications with event id', () => {
    expect(buildEventReminderNotification('event-1', 'Sunrise Run')).toEqual({
      type: NotificationType.EventReminder,
      title: 'Event joined',
      body: 'You are in for Sunrise Run',
      data: { eventId: 'event-1' },
    });
  });
});
