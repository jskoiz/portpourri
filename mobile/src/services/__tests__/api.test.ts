import { discoveryApi, matchesApi, notificationsApi, profileApi } from '../api';
import client from '../../api/client';
import * as observability from '../../api/observability';

jest.mock('../../api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

jest.mock('../../api/observability', () => ({
  logApiFailure: jest.fn(),
}));

const mockClient = client as jest.Mocked<typeof client>;
const mockLogApiFailure = observability.logApiFailure as jest.Mock;

const networkError = new Error('Network Error');

describe('matchesApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns response on success', async () => {
      const mockData = [{ id: 'match-1', createdAt: '2026-01-01', user: { id: 'user-1' } }];
      mockClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await matchesApi.list();

      expect(mockClient.get).toHaveBeenCalledWith('/matches');
      expect(result.data).toEqual(mockData);
      expect(mockLogApiFailure).not.toHaveBeenCalled();
    });

    it('logs failure and rethrows on error', async () => {
      mockClient.get.mockRejectedValueOnce(networkError);

      await expect(matchesApi.list()).rejects.toThrow('Network Error');
      expect(mockLogApiFailure).toHaveBeenCalledWith('matches', 'list', networkError, undefined);
    });
  });

  describe('getMessages', () => {
    it('returns response on success', async () => {
      const mockMessages = [{ id: 'msg-1', text: 'hello', sender: 'me' }];
      mockClient.get.mockResolvedValueOnce({ data: mockMessages });

      const result = await matchesApi.getMessages('match-1');

      expect(mockClient.get).toHaveBeenCalledWith('/matches/match-1/messages');
      expect(result.data).toEqual(mockMessages);
      expect(mockLogApiFailure).not.toHaveBeenCalled();
    });

    it('logs failure with matchId context and rethrows on error', async () => {
      mockClient.get.mockRejectedValueOnce(networkError);

      await expect(matchesApi.getMessages('match-1')).rejects.toThrow('Network Error');
      expect(mockLogApiFailure).toHaveBeenCalledWith(
        'matches',
        'getMessages',
        networkError,
        { matchId: 'match-1' },
      );
    });
  });

  describe('sendMessage', () => {
    it('returns response on success', async () => {
      const message = {
        id: 'msg-1',
        text: 'hello',
        sender: 'me' as const,
        timestamp: '2026-01-01T00:00:00Z',
      };
      mockClient.post.mockResolvedValueOnce({ data: message });

      const result = await matchesApi.sendMessage('match-1', 'hello');

      expect(mockClient.post).toHaveBeenCalledWith('/matches/match-1/messages', {
        content: 'hello',
      });
      expect(result.data).toEqual(message);
      expect(mockLogApiFailure).not.toHaveBeenCalled();
    });

    it('logs failure with matchId context and rethrows on error', async () => {
      mockClient.post.mockRejectedValueOnce(networkError);

      await expect(matchesApi.sendMessage('match-1', 'hello')).rejects.toThrow('Network Error');
      expect(mockLogApiFailure).toHaveBeenCalledWith(
        'matches',
        'sendMessage',
        networkError,
        { matchId: 'match-1' },
      );
    });
  });
});

describe('discoveryApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('pass', () => {
    it('returns pass status on success', async () => {
      mockClient.post.mockResolvedValueOnce({ data: { status: 'passed' } });

      const result = await discoveryApi.pass('user-2');

      expect(mockClient.post).toHaveBeenCalledWith('/discovery/pass/user-2');
      expect(result.data).toEqual({ status: 'passed' });
      expect(mockLogApiFailure).not.toHaveBeenCalled();
    });

    it('logs failure with target user context and rethrows on error', async () => {
      mockClient.post.mockRejectedValueOnce(networkError);

      await expect(discoveryApi.pass('user-2')).rejects.toThrow('Network Error');
      expect(mockLogApiFailure).toHaveBeenCalledWith(
        'discovery',
        'pass',
        networkError,
        { targetUserId: 'user-2' },
      );
    });
  });

  describe('undo', () => {
    it('returns archived match metadata when provided', async () => {
      const undoResponse = {
        status: 'undone',
        action: 'like',
        targetUserId: 'user-2',
        archivedMatchId: 'match-archived-1',
      };
      mockClient.post.mockResolvedValueOnce({ data: undoResponse });

      const result = await discoveryApi.undo();

      expect(mockClient.post).toHaveBeenCalledWith('/discovery/undo');
      expect(result.data).toEqual(undoResponse);
      expect(result.data.archivedMatchId).toBe('match-archived-1');
    });
  });
});

describe('notificationsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns response on success', async () => {
      const mockData = [{ id: 'notif-1', type: 'system', title: 'Hi', body: 'Hello', readAt: null, createdAt: '2026-01-01', userId: 'u1' }];
      mockClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await notificationsApi.list();

      expect(mockClient.get).toHaveBeenCalledWith('/notifications');
      expect(result.data).toEqual(mockData);
      expect(mockLogApiFailure).not.toHaveBeenCalled();
    });

    it('logs failure and rethrows on error', async () => {
      mockClient.get.mockRejectedValueOnce(networkError);

      await expect(notificationsApi.list()).rejects.toThrow('Network Error');
      expect(mockLogApiFailure).toHaveBeenCalledWith('notifications', 'list', networkError, undefined);
    });
  });

  describe('markRead', () => {
    it('returns response on success', async () => {
      const updatedNotif = { id: 'notif-1', type: 'system', title: 'Hi', body: 'Hello', readAt: '2026-01-01T00:00:00Z', createdAt: '2026-01-01', userId: 'u1' };
      mockClient.patch.mockResolvedValueOnce({ data: updatedNotif });

      const result = await notificationsApi.markRead('notif-1');

      expect(mockClient.patch).toHaveBeenCalledWith('/notifications/notif-1/read');
      expect(result.data).toEqual(updatedNotif);
      expect(mockLogApiFailure).not.toHaveBeenCalled();
    });

    it('logs failure with id context and rethrows on error', async () => {
      mockClient.patch.mockRejectedValueOnce(networkError);

      await expect(notificationsApi.markRead('notif-1')).rejects.toThrow('Network Error');
      expect(mockLogApiFailure).toHaveBeenCalledWith(
        'notifications',
        'markRead',
        networkError,
        { id: 'notif-1' },
      );
    });
  });

  describe('markAllRead', () => {
    it('returns response on success', async () => {
      mockClient.post.mockResolvedValueOnce({ data: { updated: 3 } });

      const result = await notificationsApi.markAllRead();

      expect(mockClient.post).toHaveBeenCalledWith('/notifications/mark-all-read');
      expect(result.data).toEqual({ updated: 3 });
      expect(mockLogApiFailure).not.toHaveBeenCalled();
    });

    it('logs failure and rethrows on error', async () => {
      mockClient.post.mockRejectedValueOnce(networkError);

      await expect(notificationsApi.markAllRead()).rejects.toThrow('Network Error');
      expect(mockLogApiFailure).toHaveBeenCalledWith('notifications', 'markAllRead', networkError, undefined);
    });
  });
});

describe('profileApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('uses the backend patch route for profile basics', async () => {
      const payload = { bio: 'Updated bio', city: 'Vancouver' };
      mockClient.patch.mockResolvedValueOnce({ data: { userId: 'user-1', ...payload } });

      const result = await profileApi.updateProfile(payload);

      expect(mockClient.patch).toHaveBeenCalledWith('/profile', payload);
      expect(result.data).toEqual({ userId: 'user-1', ...payload });
      expect(mockLogApiFailure).not.toHaveBeenCalled();
    });

    it('logs failures and rethrows when profile basics update fails', async () => {
      const payload = { bio: 'Updated bio' };
      mockClient.patch.mockRejectedValueOnce(networkError);

      await expect(profileApi.updateProfile(payload)).rejects.toThrow('Network Error');
      expect(mockLogApiFailure).toHaveBeenCalledWith('profile', 'updateProfile', networkError, undefined);
    });
  });

  describe('updateFitness', () => {
    it('uses the backend patch route for fitness profile updates', async () => {
      const payload = {
        intensityLevel: 'moderate',
        weeklyFrequencyBand: '3-4',
        primaryGoal: 'connection',
        favoriteActivities: 'Running, Surfing',
        prefersMorning: true,
        prefersEvening: false,
      };
      const apiPayload = {
        ...payload,
        intensityLevel: 'INTERMEDIATE',
      };
      mockClient.patch.mockResolvedValueOnce({ data: { id: 'user-1', fitnessProfile: apiPayload } });

      const result = await profileApi.updateFitness(payload);

      expect(mockClient.patch).toHaveBeenCalledWith('/profile/fitness', apiPayload);
      expect(result.data).toEqual({ id: 'user-1', fitnessProfile: apiPayload });
      expect(mockLogApiFailure).not.toHaveBeenCalled();
    });

    it('logs failures and rethrows when fitness profile update fails', async () => {
      const payload = {
        intensityLevel: 'moderate',
        weeklyFrequencyBand: '3-4',
        primaryGoal: 'connection',
        favoriteActivities: 'Running, Surfing',
      };
      mockClient.patch.mockRejectedValueOnce(networkError);

      await expect(profileApi.updateFitness(payload)).rejects.toThrow('Network Error');
      expect(mockLogApiFailure).toHaveBeenCalledWith('profile', 'updateFitness', networkError, undefined);
    });
  });

  describe('uploadPhoto', () => {
    it('passes multipart payload and forwards upload progress', async () => {
      const onProgress = jest.fn();
      mockClient.post.mockImplementationOnce(async (_url, _body, config) => {
        config?.onUploadProgress?.({ loaded: 45, total: 90 } as any);
        return { data: { id: 'photo-1' } };
      });

      await profileApi.uploadPhoto({
        uri: 'file:///tmp/photo.jpg',
        mimeType: 'image/jpeg',
        fileName: 'photo.jpg',
        onProgress,
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        '/profile/photos',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: expect.any(Function),
        }),
      );
      expect(onProgress).toHaveBeenCalledWith(50);
      expect(mockLogApiFailure).not.toHaveBeenCalled();
    });
  });
});
