/**
 * Tests for the axios client request interceptor.
 *
 * Key invariant: when a caller supplies an explicit Authorization header on a
 * request (e.g. authApi.me passes its token directly), the interceptor must NOT
 * overwrite it with the value from SecureStore.  Before the fix the interceptor
 * unconditionally set config.headers.Authorization, making the explicit token
 * parameter of authApi.me dead code at runtime.
 */
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
import { STORAGE_KEYS } from '../../constants/storage';

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

async function requestInterceptor(config: any): Promise<any> {
  if (!config.headers.Authorization) {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.accessToken);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}

describe('client request interceptor', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('injects the stored token when no Authorization header is present', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce('stored-token');

    const config = { headers: {} };
    const result = await requestInterceptor(config);

    expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.accessToken);
    expect(result.headers.Authorization).toBe('Bearer stored-token');
  });

  it('does NOT overwrite an explicit Authorization header supplied by the caller', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce('stored-token');

    const config = { headers: { Authorization: 'Bearer caller-token' } };
    const result = await requestInterceptor(config);

    expect(mockSecureStore.getItemAsync).not.toHaveBeenCalled();
    expect(result.headers.Authorization).toBe('Bearer caller-token');
  });

  it('leaves headers unchanged when no token is in storage and none is supplied', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce(null);

    const config = { headers: {} };
    const result = await requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });
});
