import * as SecureStore from 'expo-secure-store';
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

const MAX_RETRIES = 5;
const MAX_BACKOFF_MS = 30_000;

function getBackoffMs(attempt: number): number {
  return Math.min(1_000 * Math.pow(2, attempt), MAX_BACKOFF_MS);
}

export async function connectMatchMessageStream(
  matchId: string,
  handlers: {
    onMessage: (payload: MessageEventPayload) => void;
    onStatus: (status: RealtimeStatus) => void;
    onError?: (error: unknown) => void;
  },
): Promise<() => void> {
  const EventSourceCtor = (globalThis as { EventSource?: typeof EventSource }).EventSource;
  if (!EventSourceCtor) {
    handlers.onStatus('fallback');
    return () => undefined;
  }

  const token = await SecureStore.getItemAsync(STORAGE_KEYS.accessToken);
  if (!token) {
    handlers.onStatus('fallback');
    return () => undefined;
  }

  let retryCount = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;
  let source: EventSource | null = null;

  function connect() {
    if (closed) return;

    handlers.onStatus('connecting');

    const streamUrl = `${env.apiUrl}/matches/${matchId}/messages/stream`;
    source = new EventSourceCtor!(streamUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    } as EventSourceInit);

    source!.onopen = () => {
      retryCount = 0;
      handlers.onStatus('connected');
    };

    source!.addEventListener('message', (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data as string) as MessageEventPayload;
        handlers.onMessage(payload);
      } catch (error) {
        handlers.onError?.(error);
      }
    });

    source!.onerror = (error: Event) => {
      handlers.onError?.(error);
      source?.close();
      source = null;

      if (closed) return;

      retryCount += 1;
      if (retryCount > MAX_RETRIES) {
        handlers.onStatus('fallback');
        return;
      }

      const delay = getBackoffMs(retryCount - 1);
      retryTimer = setTimeout(connect, delay);
    };
  }

  connect();

  return () => {
    closed = true;
    if (retryTimer) clearTimeout(retryTimer);
    source?.close();
    source = null;
  };
}
