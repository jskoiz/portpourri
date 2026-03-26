import type { AppNotification } from '../../api/types';
import type { RootStackParamList } from '../../core/navigation/types';

type NotificationTarget =
  | { route: 'Chat'; params: RootStackParamList['Chat'] }
  | { route: 'EventDetail'; params: RootStackParamList['EventDetail'] }
  | { route: 'ProfileDetail'; params: RootStackParamList['ProfileDetail'] };

export type NotificationNavigationResult =
  | { ok: true; target: NotificationTarget }
  | { ok: false; error: string };

function getIdFromNotificationData(
  data: Record<string, unknown> | undefined,
  key: string,
) {
  const value = data?.[key];
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  return undefined;
}

function buildNotificationUserFallback(id: string, label: string) {
  return { id, firstName: label };
}

export function resolveNotificationNavigation(
  notification: AppNotification,
): NotificationNavigationResult {
  const data = notification.data as Record<string, string> | undefined;
  const matchId = getIdFromNotificationData(data, 'matchId');
  const withUserId = getIdFromNotificationData(data, 'withUserId');
  const senderId = getIdFromNotificationData(data, 'senderId');
  const fromUserId = getIdFromNotificationData(data, 'fromUserId');
  const eventId = getIdFromNotificationData(data, 'eventId');

  if (notification.type === 'match_created') {
    if (!matchId || !withUserId) {
      return {
        ok: false,
        error: 'Match notification is missing navigation details.',
      };
    }

    return {
      ok: true,
      target: {
        route: 'Chat',
        params: {
          matchId,
          user: buildNotificationUserFallback(withUserId, 'Match'),
        },
      },
    };
  }

  if (notification.type === 'message_received') {
    if (!matchId) {
      return {
        ok: false,
        error: 'Message notification is missing navigation details.',
      };
    }

    const fallbackUserId = senderId || withUserId || matchId;
    return {
      ok: true,
      target: {
        route: 'Chat',
        params: {
          matchId,
          user: buildNotificationUserFallback(
            fallbackUserId,
            senderId ? 'Message' : 'Match',
          ),
        },
      },
    };
  }

  if (notification.type === 'event_rsvp' || notification.type === 'event_reminder') {
    if (!eventId) {
      return {
        ok: false,
        error: 'Event notification is missing navigation details.',
      };
    }

    return {
      ok: true,
      target: {
        route: 'EventDetail',
        params: { eventId },
      },
    };
  }

  if (notification.type === 'like_received') {
    if (!fromUserId) {
      return {
        ok: false,
        error: 'Like notification is missing navigation details.',
      };
    }

    return {
      ok: true,
      target: {
        route: 'ProfileDetail',
        params: {
          user: buildNotificationUserFallback(fromUserId, 'Profile'),
        },
      },
    };
  }

  return {
    ok: false,
    error: 'This notification does not support direct navigation.',
  };
}
