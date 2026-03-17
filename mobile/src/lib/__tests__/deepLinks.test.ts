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
      const data: NotificationData = { type: 'match_created', matchId: 'm1' };
      expect(getNavigationTarget(data)).toEqual({
        screen: 'Chat',
        params: { matchId: 'm1' },
      });
    });

    it('routes message_received to Chat with matchId', () => {
      const data: NotificationData = { type: 'message_received', matchId: 'm2' };
      expect(getNavigationTarget(data)).toEqual({
        screen: 'Chat',
        params: { matchId: 'm2' },
      });
    });

    it('routes event_invite to Chat with matchId', () => {
      const data: NotificationData = { type: 'event_invite', matchId: 'm3' };
      expect(getNavigationTarget(data)).toEqual({
        screen: 'Chat',
        params: { matchId: 'm3' },
      });
    });

    it('routes like_received to Inbox tab', () => {
      const data: NotificationData = { type: 'like_received' };
      expect(getNavigationTarget(data)).toEqual({
        screen: 'Main',
        params: { screen: 'Inbox' },
      });
    });

    it('routes event_rsvp to EventDetail with eventId', () => {
      const data: NotificationData = { type: 'event_rsvp', eventId: 'e1' };
      expect(getNavigationTarget(data)).toEqual({
        screen: 'EventDetail',
        params: { eventId: 'e1' },
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
      const data: NotificationData = { type: 'match_created', matchId: 'm1' };

      handleNotificationNavigation(data, { navigate });

      expect(navigate).toHaveBeenCalledWith('Chat', { matchId: 'm1' });
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

    it('navigates to Inbox tab for like_received', () => {
      const navigate = jest.fn();
      const data: NotificationData = { type: 'like_received' };

      handleNotificationNavigation(data, { navigate });

      expect(navigate).toHaveBeenCalledWith('Main', { screen: 'Inbox' });
    });

    it('navigates to EventDetail for event_rsvp', () => {
      const navigate = jest.fn();
      const data: NotificationData = { type: 'event_rsvp', eventId: 'e5' };

      handleNotificationNavigation(data, { navigate });

      expect(navigate).toHaveBeenCalledWith('EventDetail', { eventId: 'e5' });
    });
  });
});
