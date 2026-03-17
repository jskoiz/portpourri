import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { env } from '../config/env';
import { STORAGE_KEYS } from '../constants/storage';

let socket: Socket | null = null;

const getToken = (key: string) =>
  Platform.OS === 'web'
    ? Promise.resolve(localStorage.getItem(key))
    : SecureStore.getItemAsync(key);

/**
 * Returns the current socket instance, or null if not connected.
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Connect to the backend /chat WebSocket namespace.
 * Uses the provided token, or reads from secure storage if omitted.
 * Auto-reconnects with exponential backoff.
 */
export async function connectSocket(token?: string): Promise<Socket> {
  if (socket?.connected) {
    return socket;
  }

  // Disconnect any stale instance
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const authToken = token || (await getToken(STORAGE_KEYS.accessToken));
  if (!authToken) {
    throw new Error('No auth token available for WebSocket connection');
  }

  // Derive the WS base URL from the API URL (strip trailing /api if present)
  const baseUrl = env.apiUrl.replace(/\/api\/?$/, '');

  socket = io(`${baseUrl}/chat`, {
    auth: { token: authToken },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    randomizationFactor: 0.5,
    timeout: 10000,
  });

  return socket;
}

/**
 * Disconnect the socket and clean up.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
