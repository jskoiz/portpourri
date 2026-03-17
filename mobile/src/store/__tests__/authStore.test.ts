import { useAuthStore } from '../authStore';
import { authApi } from '../../services/api';
import { getToken, setToken, deleteToken } from '../../lib/secureStorage';

jest.mock('@sentry/react-native', () => ({
  setUser: jest.fn(),
}));

jest.mock('../../lib/secureStorage', () => ({
  getToken: jest.fn(),
  setToken: jest.fn(),
  deleteToken: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../../lib/query/queryClient', () => ({
  queryClient: { clear: jest.fn() },
}));

jest.mock('../../services/api', () => ({
  authApi: {
    login: jest.fn(),
    signup: jest.fn(),
    me: jest.fn(),
    deleteAccount: jest.fn(),
  },
}));

const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;
const mockSetToken = setToken as jest.MockedFunction<typeof setToken>;
const mockDeleteToken = deleteToken as jest.MockedFunction<typeof deleteToken>;
const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

describe('authStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ token: null, user: null, isLoading: false });
  });

  describe('deleteAccount', () => {
    it('clears token from secure storage and clears in-memory session on success', async () => {
      mockAuthApi.deleteAccount.mockResolvedValueOnce({ data: undefined } as any);
      mockDeleteToken.mockResolvedValueOnce(undefined);

      useAuthStore.setState({ token: 'tok', user: { id: 'u1' } });

      await useAuthStore.getState().deleteAccount();

      expect(mockDeleteToken).toHaveBeenCalled();
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
      expect(mockDeleteToken).not.toHaveBeenCalled();
    });

    it('still clears in-memory session even when secure storage deletion throws', async () => {
      mockAuthApi.deleteAccount.mockResolvedValueOnce({ data: undefined } as any);
      mockDeleteToken.mockRejectedValueOnce(new Error('Storage unavailable'));

      useAuthStore.setState({ token: 'tok', user: { id: 'u1' } });

      await expect(useAuthStore.getState().deleteAccount()).rejects.toThrow(
        'Storage unavailable',
      );

      // But the in-memory session MUST be cleared regardless
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('logout', () => {
    it('removes token from secure storage and clears session', async () => {
      mockDeleteToken.mockResolvedValueOnce(undefined);

      useAuthStore.setState({ token: 'tok', user: { id: 'u1' } });

      await useAuthStore.getState().logout();

      expect(mockDeleteToken).toHaveBeenCalled();
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
      mockSetToken.mockResolvedValueOnce(undefined);

      await useAuthStore.getState().login({ email: 'a@b.com', password: 'pass' });

      expect(mockSetToken).toHaveBeenCalledWith('new-token');
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
      mockGetToken.mockResolvedValueOnce(null);

      await useAuthStore.getState().loadToken();

      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('restores token and user when stored token is valid', async () => {
      const user = { id: 'u1' };
      mockGetToken.mockResolvedValueOnce('stored-token');
      mockAuthApi.me.mockResolvedValueOnce({ data: user } as any);

      await useAuthStore.getState().loadToken();

      expect(useAuthStore.getState().token).toBe('stored-token');
      expect(useAuthStore.getState().user).toEqual(user);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('clears token and user when server returns 401', async () => {
      const axiosError = Object.assign(new Error('Unauthorized'), {
        response: { status: 401, data: { message: 'Token expired' } },
        isAxiosError: true,
      });
      mockGetToken.mockResolvedValueOnce('expired-token');
      mockAuthApi.me.mockRejectedValueOnce(axiosError);

      await useAuthStore.getState().loadToken();

      expect(mockDeleteToken).toHaveBeenCalled();
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('clears token and user when server returns 403', async () => {
      const axiosError = Object.assign(new Error('Forbidden'), {
        response: { status: 403, data: {} },
        isAxiosError: true,
      });
      mockGetToken.mockResolvedValueOnce('revoked-token');
      mockAuthApi.me.mockRejectedValueOnce(axiosError);

      await useAuthStore.getState().loadToken();

      expect(mockDeleteToken).toHaveBeenCalled();
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('keeps token on network error so the app can retry later', async () => {
      const networkError = Object.assign(new Error('Network Error'), {
        isAxiosError: true,
        // no response property — indicates a network-level failure
      });
      mockGetToken.mockResolvedValueOnce('valid-token');
      mockAuthApi.me.mockRejectedValueOnce(networkError);

      await useAuthStore.getState().loadToken();

      expect(mockDeleteToken).not.toHaveBeenCalled();
      expect(useAuthStore.getState().token).toBe('valid-token');
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('keeps token on timeout error', async () => {
      const timeoutError = Object.assign(new Error('timeout of 10000ms exceeded'), {
        isAxiosError: true,
        code: 'ECONNABORTED',
      });
      mockGetToken.mockResolvedValueOnce('valid-token');
      mockAuthApi.me.mockRejectedValueOnce(timeoutError);

      await useAuthStore.getState().loadToken();

      expect(mockDeleteToken).not.toHaveBeenCalled();
      expect(useAuthStore.getState().token).toBe('valid-token');
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('keeps token on 500 server error', async () => {
      const serverError = Object.assign(new Error('Internal Server Error'), {
        response: { status: 500, data: {} },
        isAxiosError: true,
      });
      mockGetToken.mockResolvedValueOnce('valid-token');
      mockAuthApi.me.mockRejectedValueOnce(serverError);

      await useAuthStore.getState().loadToken();

      expect(mockDeleteToken).not.toHaveBeenCalled();
      expect(useAuthStore.getState().token).toBe('valid-token');
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });
});
