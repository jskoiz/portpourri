import { STORAGE_KEYS } from '../constants/storage';
import { storage } from './storage';
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
    await storage.deleteItemAsync(STORAGE_KEYS.accessToken);
    await unauthorizedHandler?.();
  } finally {
    isHandlingUnauthorized = false;
  }
}
