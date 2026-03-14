import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../authStore';
import { authApi } from '../../services/api';
import { STORAGE_KEYS } from '../../constants/storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../services/api', () => ({
  authApi: {
    login: jest.fn(),
    signup: jest.fn(),
    me: jest.fn(),
    deleteAccount: jest.fn(),
  },
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

describe('authStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ token: null, user: null, isLoading: false });
  });

  describe('deleteAccount', () => {
    it('clears token from AsyncStorage and clears in-memory session on success', async () => {
      mockAuthApi.deleteAccount.mockResolvedValueOnce({ data: undefined } as any);
      mockAsyncStorage.removeItem.mockResolvedValueOnce(undefined);

      useAuthStore.setState({ token: 'tok', user: { id: 'u1' } });

      await useAuthStore.getState().deleteAccount();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.accessToken);
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('throws normalized error and does not clear session when API call fails', async () => {
      const apiError = Object.assign(new Error('Forbidden'), { response: { status: 403, data: {} } });
      mockAuthApi.deleteAccount.mockRejectedValueOnce(apiError);

      useAuthStore.setState({ token: 'tok', user: { id: 'u1' } });

      await expect(useAuthStore.getState().deleteAccount()).rejects.toMatchObject({
        isNetworkError: false,
        isUnauthorized: false,
      });

      // Session should remain intact — the account was not deleted
      expect(useAuthStore.getState().token).toBe('tok');
      expect(useAuthStore.getState().user).toEqual({ id: 'u1' });
      expect(mockAsyncStorage.removeItem).not.toHaveBeenCalled();
    });

    it('still clears in-memory session even when AsyncStorage.removeItem throws', async () => {
      mockAuthApi.deleteAccount.mockResolvedValueOnce({ data: undefined } as any);
      mockAsyncStorage.removeItem.mockRejectedValueOnce(new Error('Storage unavailable'));

      useAuthStore.setState({ token: 'tok', user: { id: 'u1' } });

      // The error from AsyncStorage is not swallowed — it propagates
      await expect(useAuthStore.getState().deleteAccount()).rejects.toThrow('Storage unavailable');

      // But the in-memory session MUST be cleared regardless
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('logout', () => {
    it('removes token from AsyncStorage and clears session', async () => {
      mockAsyncStorage.removeItem.mockResolvedValueOnce(undefined);

      useAuthStore.setState({ token: 'tok', user: { id: 'u1' } });

      await useAuthStore.getState().logout();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.accessToken);
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('login', () => {
    it('persists token and updates store on success', async () => {
      const user = { id: 'u1', firstName: 'Alice' };
      mockAuthApi.login.mockResolvedValueOnce({
        data: { access_token: 'new-token', user },
      } as any);
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      await useAuthStore.getState().login({ email: 'a@b.com', password: 'pass' });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.accessToken, 'new-token');
      expect(useAuthStore.getState().token).toBe('new-token');
      expect(useAuthStore.getState().user).toEqual(user);
    });

    it('throws normalized error on API failure', async () => {
      const apiError = Object.assign(new Error('Unauthorized'), {
        response: { status: 401, data: { message: 'Invalid credentials' } },
        isAxiosError: true,
      });
      mockAuthApi.login.mockRejectedValueOnce(apiError);

      await expect(
        useAuthStore.getState().login({ email: 'a@b.com', password: 'wrong' }),
      ).rejects.toMatchObject({ isUnauthorized: true, message: 'Invalid credentials' });
    });
  });

  describe('loadToken', () => {
    it('sets isLoading false and clears state when no token is stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      await useAuthStore.getState().loadToken();

      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('restores token and user when stored token is valid', async () => {
      const user = { id: 'u1' };
      mockAsyncStorage.getItem.mockResolvedValueOnce('stored-token');
      mockAuthApi.me.mockResolvedValueOnce({ data: user } as any);

      await useAuthStore.getState().loadToken();

      expect(useAuthStore.getState().token).toBe('stored-token');
      expect(useAuthStore.getState().user).toEqual(user);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('clears token and user when stored token is expired', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('expired-token');
      mockAuthApi.me.mockRejectedValueOnce(new Error('401'));

      await useAuthStore.getState().loadToken();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.accessToken);
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });
});
