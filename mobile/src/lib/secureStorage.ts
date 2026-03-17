import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../constants/storage';

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(STORAGE_KEYS.accessToken);
  }
  return SecureStore.getItemAsync(STORAGE_KEYS.accessToken);
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(STORAGE_KEYS.accessToken, token);
    return;
  }
  await SecureStore.setItemAsync(STORAGE_KEYS.accessToken, token);
}

export async function deleteToken(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    return;
  }
  await SecureStore.deleteItemAsync(STORAGE_KEYS.accessToken);
}
