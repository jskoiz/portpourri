import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '../config/env';
import { STORAGE_KEYS } from '../constants/storage';

type RealtimeStatus = 'connecting' | 'connected' | 'fallback';

type MessageEventPayload = {
  type: 'message';
  matchId: string;
  message: {
    id: string;
    text: string;
    sender: 'me' | 'them';
    timestamp: string;
  };
};

export async function connectMatchMessageStream(
  matchId: string,
  handlers: {
    onMessage: (payload: MessageEventPayload) => void;
    onStatus: (status: RealtimeStatus) => void;
    onError?: (error: unknown) => void;
  },
): Promise<() => void> {
  const EventSourceCtor = (globalThis as { EventSource?: any }).EventSource;
  if (!EventSourceCtor) {
    handlers.onStatus('fallback');
    return () => undefined;
  }

  const token = await AsyncStorage.getItem(STORAGE_KEYS.accessToken);
  if (!token) {
    handlers.onStatus('fallback');
    return () => undefined;
  }

  handlers.onStatus('connecting');

  const streamUrl = `${env.apiUrl}/matches/${matchId}/messages/stream`;
  const source = new EventSourceCtor(streamUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  source.onopen = () => handlers.onStatus('connected');

  source.addEventListener('message', (event: MessageEvent) => {
    try {
      const payload = JSON.parse((event as any).data) as MessageEventPayload;
      handlers.onMessage(payload);
    } catch (error) {
      handlers.onError?.(error);
    }
  });

  source.onerror = (error: unknown) => {
    handlers.onError?.(error);
    handlers.onStatus('fallback');
    source.close();
  };

  return () => source.close();
}
