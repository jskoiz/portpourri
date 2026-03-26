import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from '../core/navigation/types';
import {
  resolveNotificationRoute,
  type NotificationNavigationResult,
  type NotificationRouteInput,
} from '../features/notifications/notificationNavigation';

/**
 * Deep link URL scheme prefix.
 */
const DEEP_LINK_PREFIX = 'brdg://';

/**
 * Notification payload data shape sent by the push notification system.
 */
export interface NotificationData {
  type: string;
  matchId?: string;
  eventId?: string;
  attendeeId?: string;
  fromUserId?: string;
  withUserId?: string;
  senderId?: string;
  inviterId?: string;
  notificationId?: string;
}

/**
 * React Navigation linking configuration that maps deep link URLs to screens.
 *
 * Supported routes:
 * - brdg://chat/:matchId
 * - brdg://event/:eventId
 * - brdg://matches
 * - brdg://profile/:userId
 */
export const linkingConfig: LinkingOptions<RootStackParamList> = {
  prefixes: [DEEP_LINK_PREFIX],
  config: {
    screens: {
      Chat: {
        path: 'chat/:matchId',
        parse: {
          matchId: (matchId: string) => matchId,
        },
      },
      EventDetail: {
        path: 'event/:eventId',
        parse: {
          eventId: (eventId: string) => eventId,
        },
      },
      Main: {
        screens: {
          Inbox: 'matches',
        },
      },
      ProfileDetail: {
        path: 'profile/:userId',
        parse: {
          userId: (userId: string) => userId,
        },
      },
    },
  },
};

/**
 * Maps a notification type to a navigation action.
 * Returns the screen name and params to navigate to, or null if the
 * notification type is unrecognised or required data is missing.
 */
export function getNavigationTarget(
  data: NotificationData,
): { screen: keyof RootStackParamList; params: Record<string, unknown> } | null {
  const { type, ...payload } = data;
  const result = resolveNotificationRoute({
    type,
    data: payload,
  } as NotificationRouteInput);
  if (!result.ok) return null;
  return {
    screen: result.target.route,
    params: result.target.params as Record<string, unknown>,
  };
}

/**
 * Navigates to the appropriate screen based on push notification data.
 *
 * @param data  The notification payload data
 * @param navigation  A navigation object (from useNavigation or navigationRef)
 */
export function handleNotificationNavigation(
  data: NotificationData,
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void },
): NotificationNavigationResult {
  const { type, ...payload } = data;
  const result = resolveNotificationRoute({
    type,
    data: payload,
  } as NotificationRouteInput);
  if (!result.ok) {
    return result;
  }

  navigation.navigate(result.target.route, result.target.params);
  return result;
}
