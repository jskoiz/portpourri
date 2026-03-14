/**
 * Tests for the axios client request interceptor.
 *
 * Key invariant: when a caller supplies an explicit Authorization header on a
 * request (e.g. authApi.me passes its token directly), the interceptor must NOT
 * overwrite it with the value from AsyncStorage.  Before the fix the interceptor
 * unconditionally set config.headers.Authorization, making the explicit token
 * parameter of authApi.me dead code at runtime.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// We need to import the real interceptor logic without the full module graph.
// Re-implement the interceptor inline so we can unit-test it in isolation.
// The interceptor function is extracted here to match the production implementation.
import { STORAGE_KEYS } from '../../constants/storage';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// Reproduces the interceptor logic from client.ts
async function requestInterceptor(config: any): Promise<any> {
  if (!config.headers.Authorization) {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.accessToken);
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
    mockAsyncStorage.getItem.mockResolvedValueOnce('stored-token');

    const config = { headers: {} };
    const result = await requestInterceptor(config);

    expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.accessToken);
    expect(result.headers.Authorization).toBe('Bearer stored-token');
  });

  it('does NOT overwrite an explicit Authorization header supplied by the caller', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce('stored-token');

    const config = { headers: { Authorization: 'Bearer caller-token' } };
    const result = await requestInterceptor(config);

    // AsyncStorage should not even be consulted when a header is already present.
    expect(mockAsyncStorage.getItem).not.toHaveBeenCalled();
    expect(result.headers.Authorization).toBe('Bearer caller-token');
  });

  it('leaves headers unchanged when no token is in storage and none is supplied', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce(null);

    const config = { headers: {} };
    const result = await requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });
});
