import {
  buildNotificationSections,
  getNotificationMeta,
  getNotificationGroup,
} from '../notificationPresentation';
import { resolveNotificationNavigation } from '../notificationNavigation';
import type { AppNotification } from '../../../api/types';

function buildNotification(
  overrides: Partial<AppNotification> = {},
): AppNotification {
  return {
    id: 'notif-1',
    userId: 'user-1',
    type: 'match_created',
    title: 'Title',
    body: 'Body',
    data: {},
    read: false,
    readAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('notification helpers', () => {
  it('groups notifications into today, yesterday, and earlier sections', () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const earlier = new Date();
    earlier.setDate(earlier.getDate() - 5);

    const sections = buildNotificationSections([
      buildNotification({ id: 'today', createdAt: today.toISOString() }),
      buildNotification({ id: 'yesterday', createdAt: yesterday.toISOString() }),
      buildNotification({ id: 'earlier', createdAt: earlier.toISOString() }),
    ]);

    expect(getNotificationGroup(today)).toBe('Today');
    expect(sections.map((section) => section.title)).toEqual([
      'Today',
      'Yesterday',
      'Earlier',
    ]);
  });

  it('resolves match notifications to chat', () => {
    const result = resolveNotificationNavigation(
      buildNotification({
        type: 'match_created',
        data: { matchId: 'match-1', withUserId: 'user-2' },
      }),
    );

    expect(result).toEqual({
      ok: true,
      target: {
        route: 'Chat',
        params: {
          matchId: 'match-1',
          user: { id: 'user-2', firstName: 'Match' },
        },
      },
    });
  });

  it('resolves message notifications with sender fallback details', () => {
    const result = resolveNotificationNavigation(
      buildNotification({
        type: 'message_received',
        data: { matchId: 'match-2', senderId: 'user-3' },
      }),
    );

    expect(result).toEqual({
      ok: true,
      target: {
        route: 'Chat',
        params: {
          matchId: 'match-2',
          user: { id: 'user-3', firstName: 'Message' },
        },
      },
    });
  });

  it('resolves event reminders to event detail', () => {
    const result = resolveNotificationNavigation(
      buildNotification({
        type: 'event_reminder',
        data: { eventId: 'event-9' },
      }),
    );

    expect(result).toEqual({
      ok: true,
      target: {
        route: 'EventDetail',
        params: {
          eventId: 'event-9',
        },
      },
    });
  });

  it('resolves event invites to chat using the sender context', () => {
    const result = resolveNotificationNavigation(
      buildNotification({
        type: 'event_reminder',
        data: {
          type: 'event_invite',
          matchId: 'match-9',
          senderId: 'user-4',
        },
      }),
    );

    expect(result).toEqual({
      ok: true,
      target: {
        route: 'Chat',
        params: {
          matchId: 'match-9',
          user: { id: 'user-4', firstName: 'Match' },
        },
      },
    });
  });

  it('renders event invites with chat styling', () => {
    expect(getNotificationMeta('event_invite')).toEqual({
      icon: 'calendar',
      color: '#8BAA7A',
    });
  });

  it('returns an error when required notification payload data is missing', () => {
    const result = resolveNotificationNavigation(
      buildNotification({
        type: 'like_received',
        data: {},
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: 'Like notification is missing navigation details.',
      kind: 'malformed',
      type: 'like_received',
    });
  });

  it('routes event invite notifications to chat', () => {
    const result = resolveNotificationNavigation(
      buildNotification({
        type: 'event_invite',
        data: { eventId: 'event-1', matchId: 'match-2', withUserId: 'user-9' },
      }),
    );

    expect(result).toEqual({
      ok: true,
      target: {
        route: 'Chat',
        params: {
          matchId: 'match-2',
          user: { id: 'user-9', firstName: 'Event' },
        },
      },
    });
  });
});
