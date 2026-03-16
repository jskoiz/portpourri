import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../constants/storage';

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
    await SecureStore.deleteItemAsync(STORAGE_KEYS.accessToken);
    await unauthorizedHandler?.();
  } finally {
    isHandlingUnauthorized = false;
  }
}
