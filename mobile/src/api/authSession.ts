import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../constants/storage';
import { queryClient } from '../lib/query/queryClient';

type UnauthorizedHandler = () => void | Promise<void>;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

let isHandlingUnauthorized = false;

export async function handleUnauthorized() {
  if (isHandlingUnauthorized) return;
  isHandlingUnauthorized = true;
  try {
    queryClient.clear();
    await SecureStore.deleteItemAsync(STORAGE_KEYS.accessToken);
    queryClient.clear();
    await unauthorizedHandler?.();
  } finally {
    isHandlingUnauthorized = false;
  }
}
