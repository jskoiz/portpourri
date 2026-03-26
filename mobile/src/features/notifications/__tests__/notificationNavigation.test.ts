import {
  clearBlockedUserIds,
  registerBlockedUserId,
} from '../../../lib/moderation/blockedUsers';
import { resolveNotificationNavigation } from '../notificationNavigation';
import type { AppNotification } from '../../../api/types';

describe('resolveNotificationNavigation', () => {
  beforeEach(() => {
    clearBlockedUserIds();
  });

  it('rejects chat navigation when the target user is blocked', () => {
    registerBlockedUserId('user-2');

    const notification = {
      id: 'notif-1',
      userId: 'me',
      type: 'match_created',
      title: 'Match',
      body: 'You matched',
      read: false,
      readAt: null,
      createdAt: new Date().toISOString(),
      data: { matchId: 'match-1', withUserId: 'user-2' },
    } as unknown as AppNotification;
    const result = resolveNotificationNavigation(notification);

    expect(result).toEqual({
      ok: false,
      error: 'This conversation is no longer available.',
    });
  });

  it('rejects profile navigation when the target user is blocked', () => {
    registerBlockedUserId('user-3');

    const notification = {
      id: 'notif-2',
      userId: 'me',
      type: 'like_received',
      title: 'Like',
      body: 'Someone liked you',
      read: false,
      readAt: null,
      createdAt: new Date().toISOString(),
      data: { fromUserId: 'user-3' },
    } as unknown as AppNotification;
    const result = resolveNotificationNavigation(notification);

    expect(result).toEqual({
      ok: false,
      error: 'This profile is no longer available.',
    });
  });
});
