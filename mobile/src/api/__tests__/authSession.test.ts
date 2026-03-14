import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleUnauthorized, setUnauthorizedHandler } from '../authSession';
import { useAuthStore } from '../../store/authStore';
import { STORAGE_KEYS } from '../../constants/storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  removeItem: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
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

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      STORAGE_KEYS.accessToken,
    );
    expect(clearSession).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();

    cleanup();
  });
});
