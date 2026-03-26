import type { AppNotification, NotificationType } from '../../api/types';
import type { RootStackParamList } from '../../core/navigation/types';

type NotificationTarget =
  | { route: 'Chat'; params: RootStackParamList['Chat'] }
  | { route: 'EventDetail'; params: RootStackParamList['EventDetail'] }
  | { route: 'ProfileDetail'; params: RootStackParamList['ProfileDetail'] };

export type NotificationNavigationResult =
  | { ok: true; target: NotificationTarget }
  | { ok: false; error: string; kind: 'unsupported' | 'malformed'; type: string };

type NotificationUiMeta = {
  icon: 'heart' | 'message-square' | 'users' | 'calendar' | 'bell';
  color: string;
  titleFallback: string;
  bodyFallback: string;
};

export interface NotificationRouteInput {
  type: string;
  data?: Record<string, unknown>;
}

type NotificationDefinition = {
  ui: NotificationUiMeta;
  resolve: (input: NotificationRouteInput) => NotificationNavigationResult;
};

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

function getEffectiveNotificationType({ type, data }: NotificationRouteInput): string {
  const legacyType = getIdFromNotificationData(data, 'type');
  const legacyKind = getIdFromNotificationData(data, 'kind');
  if (
    type === 'event_reminder' &&
    (legacyType === 'event_invite' || legacyKind === 'invite')
  ) {
    return 'event_invite';
  }
  return type;
}

function malformed(type: string, error: string): NotificationNavigationResult {
  return { ok: false, error, kind: 'malformed', type };
}

function unsupported(type: string): NotificationNavigationResult {
  return {
    ok: false,
    error: 'This notification does not support direct navigation.',
    kind: 'unsupported',
    type,
  };
}

const notificationDefinitions: Record<NotificationType, NotificationDefinition> = {
  like_received: {
    ui: {
      icon: 'heart',
      color: '#C4A882',
      titleFallback: 'New like',
      bodyFallback: 'Someone liked your profile.',
    },
    resolve(input) {
      const fromUserId = getIdFromNotificationData(input.data, 'fromUserId');
      if (!fromUserId) {
        return malformed(input.type, 'Like notification is missing navigation details.');
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
    },
  },
  match_created: {
    ui: {
      icon: 'heart',
      color: '#C4A882',
      titleFallback: 'New match',
      bodyFallback: "It's a match. You can start chatting now.",
    },
    resolve(input) {
      const matchId = getIdFromNotificationData(input.data, 'matchId');
      const withUserId = getIdFromNotificationData(input.data, 'withUserId');
      if (!matchId || !withUserId) {
        return malformed(input.type, 'Match notification is missing navigation details.');
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
    },
  },
  message_received: {
    ui: {
      icon: 'message-square',
      color: '#8BAA7A',
      titleFallback: 'New message',
      bodyFallback: 'You received a new message.',
    },
    resolve(input) {
      const matchId = getIdFromNotificationData(input.data, 'matchId');
      const withUserId = getIdFromNotificationData(input.data, 'withUserId');
      const senderId = getIdFromNotificationData(input.data, 'senderId');
      if (!matchId) {
        return malformed(input.type, 'Message notification is missing navigation details.');
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
    },
  },
  event_rsvp: {
    ui: {
      icon: 'users',
      color: '#C4A882',
      titleFallback: 'New RSVP',
      bodyFallback: 'Someone joined your event.',
    },
    resolve(input) {
      const eventId = getIdFromNotificationData(input.data, 'eventId');
      if (!eventId) {
        return malformed(input.type, 'Event notification is missing navigation details.');
      }

      return {
        ok: true,
        target: {
          route: 'EventDetail',
          params: { eventId },
        },
      };
    },
  },
  event_invite: {
    ui: {
      icon: 'calendar',
      color: '#8BAA7A',
      titleFallback: 'Event invite',
      bodyFallback: 'Someone invited you to an event.',
    },
    resolve(input) {
      const matchId = getIdFromNotificationData(input.data, 'matchId');
      const withUserId =
        getIdFromNotificationData(input.data, 'withUserId') ||
        getIdFromNotificationData(input.data, 'inviterId');
      if (!matchId) {
        return malformed(input.type, 'Event invite notification is missing navigation details.');
      }

      return {
        ok: true,
        target: {
          route: 'Chat',
          params: {
            matchId,
            user: buildNotificationUserFallback(withUserId || matchId, 'Event'),
          },
        },
      };
    },
  },
  event_reminder: {
    ui: {
      icon: 'calendar',
      color: '#8BAA7A',
      titleFallback: 'Event update',
      bodyFallback: 'There is an update for your event.',
    },
    resolve(input) {
      const eventId = getIdFromNotificationData(input.data, 'eventId');
      if (!eventId) {
        return malformed(input.type, 'Event notification is missing navigation details.');
      }

      return {
        ok: true,
        target: {
          route: 'EventDetail',
          params: { eventId },
        },
      };
    },
  },
  system: {
    ui: {
      icon: 'bell',
      color: '#B8A9C4',
      titleFallback: 'Notification',
      bodyFallback: 'Open this notification for details.',
    },
    resolve(input) {
      return unsupported(input.type);
    },
  },
};

export function getNotificationMeta(type: string): Pick<NotificationUiMeta, 'icon' | 'color'> {
  return (notificationDefinitions[type as NotificationType] ?? notificationDefinitions.system).ui;
}

export function getNotificationTitleFallback(type: string): string {
  return (notificationDefinitions[type as NotificationType] ?? notificationDefinitions.system).ui.titleFallback;
}

export function getNotificationBodyFallback(type: string): string {
  return (notificationDefinitions[type as NotificationType] ?? notificationDefinitions.system).ui.bodyFallback;
}

export function resolveNotificationRoute(
  input: NotificationRouteInput,
): NotificationNavigationResult {
  const type = getEffectiveNotificationType(input);
  const definition = notificationDefinitions[type as NotificationType];
  if (!definition) {
    return unsupported(type);
  }

  return definition.resolve({
    type,
    data: input.data,
  });
}

export function resolveNotificationNavigation(
  notification: Pick<AppNotification, 'type' | 'data'>,
): NotificationNavigationResult {
  return resolveNotificationRoute({
    type: notification.type,
    data: notification.data as Record<string, unknown> | undefined,
  });
}
