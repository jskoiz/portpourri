import {
  registerForPushNotifications,
  deregisterPushToken,
  requestPermissions,
  getExpoPushToken,
  registerPushToken,
  _resetForTesting,
} from '../pushNotifications';

// Mock expo-notifications
const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockSetNotificationChannelAsync = jest.fn();
const mockGetExpoPushTokenAsync = jest.fn();
const mockSetNotificationHandler = jest.fn();
const mockAddNotificationResponseReceivedListener = jest.fn();
const mockGetLastNotificationResponseAsync = jest.fn();

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: (...args: unknown[]) => mockGetPermissionsAsync(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
  setNotificationChannelAsync: (...args: unknown[]) => mockSetNotificationChannelAsync(...args),
  getExpoPushTokenAsync: (...args: unknown[]) => mockGetExpoPushTokenAsync(...args),
  setNotificationHandler: (...args: unknown[]) => mockSetNotificationHandler(...args),
  addNotificationResponseReceivedListener: (...args: unknown[]) =>
    mockAddNotificationResponseReceivedListener(...args),
  getLastNotificationResponseAsync: (...args: unknown[]) =>
    mockGetLastNotificationResponseAsync(...args),
  AndroidImportance: { MAX: 5 },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
  easConfig: { projectId: 'test-project-id' },
}));

const mockPost = jest.fn();
const mockDelete = jest.fn();

jest.mock('../../api/client', () => ({
  __esModule: true,
  default: {
    post: (...args: unknown[]) => mockPost(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

describe('pushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _resetForTesting();
  });

  describe('registerForPushNotifications', () => {
    it('requests permissions, gets token, and registers with backend', async () => {
      mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
      mockGetExpoPushTokenAsync.mockResolvedValue({
        data: 'ExponentPushToken[abc123]',
      });
      mockPost.mockResolvedValue({});

      await registerForPushNotifications();

      expect(mockPost).toHaveBeenCalledWith('/auth/push-token', {
        token: 'ExponentPushToken[abc123]',
      });
    });

    it('skips registration when permissions are denied', async () => {
      mockGetPermissionsAsync.mockResolvedValue({ status: 'denied' });
      mockRequestPermissionsAsync.mockResolvedValue({ status: 'denied' });

      await registerForPushNotifications();

      expect(mockPost).not.toHaveBeenCalled();
    });

    it('skips re-registration when token has not changed', async () => {
      mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
      mockGetExpoPushTokenAsync.mockResolvedValue({
        data: 'ExponentPushToken[abc123]',
      });
      mockPost.mockResolvedValue({});

      await registerForPushNotifications();
      expect(mockPost).toHaveBeenCalledTimes(1);

      // Second call with same token should be a no-op
      await registerForPushNotifications();
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('re-registers when the token changes', async () => {
      mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
      mockGetExpoPushTokenAsync.mockResolvedValueOnce({
        data: 'ExponentPushToken[abc123]',
      });
      mockPost.mockResolvedValue({});

      await registerForPushNotifications();
      expect(mockPost).toHaveBeenCalledTimes(1);

      // Token changed
      mockGetExpoPushTokenAsync.mockResolvedValueOnce({
        data: 'ExponentPushToken[new456]',
      });

      await registerForPushNotifications();
      expect(mockPost).toHaveBeenCalledTimes(2);
      expect(mockPost).toHaveBeenLastCalledWith('/auth/push-token', {
        token: 'ExponentPushToken[new456]',
      });
    });

    it('handles concurrent calls safely via guard', async () => {
      mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
      mockGetExpoPushTokenAsync.mockResolvedValue({
        data: 'ExponentPushToken[abc123]',
      });

      let resolvePost: () => void;
      const postPromise = new Promise<void>((resolve) => {
        resolvePost = resolve;
      });
      mockPost.mockReturnValue(postPromise);

      // Start two concurrent registrations
      const p1 = registerForPushNotifications();
      const p2 = registerForPushNotifications();

      // Resolve the post call
      resolvePost!();
      await p1;
      await p2;

      // Only one registration should have been sent
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('does not throw when backend registration fails', async () => {
      mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
      mockGetExpoPushTokenAsync.mockResolvedValue({
        data: 'ExponentPushToken[abc123]',
      });
      mockPost.mockRejectedValue(new Error('Network error'));

      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      // Should not throw
      await registerForPushNotifications();
      spy.mockRestore();
    });
  });

  describe('deregisterPushToken', () => {
    it('calls DELETE /auth/push-token', async () => {
      mockDelete.mockResolvedValue({});

      await deregisterPushToken();

      expect(mockDelete).toHaveBeenCalledWith('/auth/push-token');
    });

    it('does not throw on failure', async () => {
      mockDelete.mockRejectedValue(new Error('Unauthorized'));

      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      // Should not throw
      await deregisterPushToken();
      spy.mockRestore();
    });

    it('resets the last registered token', async () => {
      // Register first
      mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
      mockGetExpoPushTokenAsync.mockResolvedValue({
        data: 'ExponentPushToken[abc123]',
      });
      mockPost.mockResolvedValue({});
      await registerForPushNotifications();
      expect(mockPost).toHaveBeenCalledTimes(1);

      // Deregister
      mockDelete.mockResolvedValue({});
      await deregisterPushToken();

      // Now registering again should re-send
      await registerForPushNotifications();
      expect(mockPost).toHaveBeenCalledTimes(2);
    });
  });
});
