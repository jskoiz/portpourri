import {
  getNavigationTarget,
  handleNotificationNavigation,
  linkingConfig,
  type NotificationData,
} from '../deepLinks';

describe('deepLinks', () => {
  describe('linkingConfig', () => {
    it('uses the brdg:// prefix', () => {
      expect(linkingConfig.prefixes).toContain('brdg://');
    });

    it('defines a path for Chat screen', () => {
      const screens = linkingConfig.config?.screens as Record<string, unknown>;
      expect(screens.Chat).toEqual(
        expect.objectContaining({ path: 'chat/:matchId' }),
      );
    });

    it('defines a path for EventDetail screen', () => {
      const screens = linkingConfig.config?.screens as Record<string, unknown>;
      expect(screens.EventDetail).toEqual(
        expect.objectContaining({ path: 'event/:eventId' }),
      );
    });

    it('defines a path for matches (Inbox tab)', () => {
      const screens = linkingConfig.config?.screens as Record<string, unknown>;
      const main = screens.Main as { screens: Record<string, string> };
      expect(main.screens.Inbox).toBe('matches');
    });

    it('defines a path for ProfileDetail screen', () => {
      const screens = linkingConfig.config?.screens as Record<string, unknown>;
      expect(screens.ProfileDetail).toEqual(
        expect.objectContaining({ path: 'profile/:userId' }),
      );
    });
  });

  describe('getNavigationTarget', () => {
    it('routes match_created to Chat with matchId', () => {
      const data: NotificationData = { type: 'match_created', matchId: 'm1', withUserId: 'u1' };
      expect(getNavigationTarget(data)).toEqual({
        screen: 'Chat',
        params: { matchId: 'm1', user: { id: 'u1', firstName: 'Match' } },
      });
    });

    it('routes message_received to Chat with matchId', () => {
      const data: NotificationData = { type: 'message_received', matchId: 'm2' };
      expect(getNavigationTarget(data)).toEqual({
        screen: 'Chat',
        params: { matchId: 'm2', user: { id: 'm2', firstName: 'Match' } },
      });
    });

    it('routes event_invite to Chat with matchId', () => {
      const data: NotificationData = { type: 'event_invite', matchId: 'm3', withUserId: 'u3' };
      expect(getNavigationTarget(data)).toEqual({
        screen: 'Chat',
        params: { matchId: 'm3', user: { id: 'u3', firstName: 'Event' } },
      });
    });

    it('routes like_received to profile detail', () => {
      const data: NotificationData = { type: 'like_received', fromUserId: 'user-7' };
      expect(getNavigationTarget(data)).toEqual({
        screen: 'ProfileDetail',
        params: { user: { id: 'user-7', firstName: 'Profile' } },
      });
    });

    it('routes event_rsvp to EventDetail with eventId', () => {
      const data: NotificationData = { type: 'event_rsvp', eventId: 'e1', attendeeId: 'u2' } as NotificationData;
      expect(getNavigationTarget(data)).toEqual({
        screen: 'EventDetail',
        params: { eventId: 'e1' },
      });
    });

    it('routes event_reminder to EventDetail with eventId', () => {
      const data: NotificationData = { type: 'event_reminder', eventId: 'e9' };
      expect(getNavigationTarget(data)).toEqual({
        screen: 'EventDetail',
        params: { eventId: 'e9' },
      });
    });

    it('returns null for match_created without matchId', () => {
      const data: NotificationData = { type: 'match_created' };
      expect(getNavigationTarget(data)).toBeNull();
    });

    it('returns null for message_received without matchId', () => {
      const data: NotificationData = { type: 'message_received' };
      expect(getNavigationTarget(data)).toBeNull();
    });

    it('returns null for event_invite without matchId', () => {
      const data: NotificationData = { type: 'event_invite' };
      expect(getNavigationTarget(data)).toBeNull();
    });

    it('returns null for event_rsvp without eventId', () => {
      const data: NotificationData = { type: 'event_rsvp' };
      expect(getNavigationTarget(data)).toBeNull();
    });

    it('returns null for unknown notification type', () => {
      const data: NotificationData = { type: 'unknown_type' };
      expect(getNavigationTarget(data)).toBeNull();
    });
  });

  describe('handleNotificationNavigation', () => {
    it('calls navigate with correct screen and params', () => {
      const navigate = jest.fn();
      const data: NotificationData = { type: 'match_created', matchId: 'm1', withUserId: 'u1' };

      handleNotificationNavigation(data, { navigate });

      expect(navigate).toHaveBeenCalledWith('Chat', {
        matchId: 'm1',
        user: { id: 'u1', firstName: 'Match' },
      });
    });

    it('does not call navigate for unknown types', () => {
      const navigate = jest.fn();
      const data: NotificationData = { type: 'unknown' };

      handleNotificationNavigation(data, { navigate });

      expect(navigate).not.toHaveBeenCalled();
    });

    it('does not call navigate when required data is missing', () => {
      const navigate = jest.fn();
      const data: NotificationData = { type: 'event_rsvp' };

      handleNotificationNavigation(data, { navigate });

      expect(navigate).not.toHaveBeenCalled();
    });

    it('navigates to ProfileDetail for like_received', () => {
      const navigate = jest.fn();
      const data: NotificationData = { type: 'like_received', fromUserId: 'user-7' };

      handleNotificationNavigation(data, { navigate });

      expect(navigate).toHaveBeenCalledWith('ProfileDetail', {
        user: { id: 'user-7', firstName: 'Profile' },
      });
    });

    it('navigates to EventDetail for event_rsvp', () => {
      const navigate = jest.fn();
      const data: NotificationData = { type: 'event_rsvp', eventId: 'e5' };

      handleNotificationNavigation(data, { navigate });

      expect(navigate).toHaveBeenCalledWith('EventDetail', { eventId: 'e5' });
    });

    it('navigates to Chat for message_received', () => {
      const navigate = jest.fn();
      const data: NotificationData = { type: 'message_received', matchId: 'm2' };

      handleNotificationNavigation(data, { navigate });

      expect(navigate).toHaveBeenCalledWith('Chat', {
        matchId: 'm2',
        user: { id: 'm2', firstName: 'Match' },
      });
    });

    it('navigates to Chat for event_invite', () => {
      const navigate = jest.fn();
      const data: NotificationData = { type: 'event_invite', matchId: 'm3', withUserId: 'u3' };

      handleNotificationNavigation(data, { navigate });

      expect(navigate).toHaveBeenCalledWith('Chat', {
        matchId: 'm3',
        user: { id: 'u3', firstName: 'Event' },
      });
    });
  });
});
