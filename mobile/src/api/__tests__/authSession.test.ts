import { handleUnauthorized, setUnauthorizedHandler } from '../authSession';
import { useAuthStore } from '../../store/authStore';
import { STORAGE_KEYS } from '../../constants/storage';
import { storage } from '../storage';
import * as Sentry from '@sentry/react-native';

jest.mock('../storage', () => ({
  storage: {
    deleteItemAsync: jest.fn(),
  },
}));

jest.mock('@sentry/react-native', () => ({
  setUser: jest.fn(),
}));

describe('authSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      token: null,
      user: null,
      isLoading: false,
    });
    setUnauthorizedHandler(null);
  });

  it('clears persisted and in-memory auth state on unauthorized responses', async () => {
    useAuthStore.setState({
      token: 'expired-token',
      user: { id: 'user-1' },
      isLoading: false,
    });

    const clearSession = jest.fn(() => {
      useAuthStore.getState().clearSession();
    });
    const cleanup = setUnauthorizedHandler(clearSession);

    await handleUnauthorized();

    expect(storage.deleteItemAsync).toHaveBeenCalledWith(
      STORAGE_KEYS.accessToken,
    );
    expect(clearSession).toHaveBeenCalledTimes(1);
    expect(Sentry.setUser).toHaveBeenCalledWith(null);
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();

    cleanup();
  });

  it('still clears persisted token when unauthorized handler is not set', async () => {
    await handleUnauthorized();

    expect(storage.deleteItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.accessToken);
    expect(Sentry.setUser).toHaveBeenCalledWith(null);
  });
});
