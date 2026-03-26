/**
 * Tests for the axios client request interceptor.
 *
 * Key invariant: when a caller supplies an explicit Authorization header on a
 * request (e.g. authApi.me passes its token directly), the interceptor must NOT
 * overwrite it with the value from SecureStore.  Before the fix the interceptor
 * unconditionally set config.headers.Authorization, making the explicit token
 * parameter of authApi.me dead code at runtime.
 */

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../authSession', () => ({
  handleUnauthorized: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../../constants/storage';
import client from '../client';

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

// Helper: run only the request interceptor pipeline on a config object
async function runRequestInterceptor(config: { headers?: Record<string, string> }) {
  // Axios interceptors are stored internally; we exercise them by calling
  // client.request and intercepting before the actual HTTP call.
  // Instead, we use the axios internals: the interceptor handlers array.
  const handlers = (client.interceptors.request as any).handlers as Array<{
    fulfilled: (config: any) => Promise<any>;
  }>;
  let result: any = { ...client.defaults, ...config, headers: { ...client.defaults.headers.common, ...config.headers } };
  for (const handler of handlers) {
    if (handler?.fulfilled) {
      result = await handler.fulfilled(result);
    }
  }
  return result;
}

describe('client request interceptor', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('injects the stored token when no Authorization header is present', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce('stored-token');

    const result = await runRequestInterceptor({ headers: {} });

    expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.accessToken);
    expect(result.headers.Authorization).toBe('Bearer stored-token');
  });

  it('does NOT overwrite an explicit Authorization header supplied by the caller', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce('stored-token');

    const result = await runRequestInterceptor({ headers: { Authorization: 'Bearer caller-token' } });

    expect(mockSecureStore.getItemAsync).not.toHaveBeenCalled();
    expect(result.headers.Authorization).toBe('Bearer caller-token');
  });

  it('does NOT overwrite an explicit authorization header when header casing differs', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce('stored-token');

    const result = await runRequestInterceptor({ headers: { authorization: 'Bearer caller-token' } });

    expect(mockSecureStore.getItemAsync).not.toHaveBeenCalled();
    expect(result.headers.authorization).toBe('Bearer caller-token');
  });

  it('leaves headers unchanged when no token is in storage and none is supplied', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce(null);

    const result = await runRequestInterceptor({ headers: {} });

    expect(result.headers.Authorization).toBeUndefined();
  });
});
