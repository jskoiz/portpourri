import { env } from '../config/env';
import { getToken } from '../lib/secureStorage';

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

  const token = await getToken();
  if (!token) {
    handlers.onStatus('fallback');
    return () => undefined;
  }

  let retryCount = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;
  let source: EventSource | null = null;

  function clearRetryTimer() {
    if (!retryTimer) return;
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  const handleMessage = (event: Event) => {
    try {
      const payload = JSON.parse((event as MessageEvent).data as string) as MessageEventPayload;
      handlers.onMessage(payload);
    } catch (error) {
      handlers.onError?.(error);
    }
  };

  function closeSource(target: EventSource | null) {
    if (!target) return;

    target.removeEventListener?.('message', handleMessage);
    target.close();

    if (source === target) {
      source = null;
    }
  }

  function connect() {
    if (closed) return;
    clearRetryTimer();

    handlers.onStatus('connecting');

    const streamUrl = `${env.apiUrl}/matches/${matchId}/messages/stream`;
    // TODO: Replace the long-lived access token with a short-lived, scoped
    // connection token to limit exposure in URL/query-string logs. For now the
    // backend JWT strategy accepts `token` as a query parameter fallback since
    // EventSource does not support custom headers.
    const urlWithToken = `${streamUrl}${streamUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token ?? '')}`;
    const nextSource = new EventSourceCtor!(urlWithToken, {} as EventSourceInit);
    source = nextSource;

    nextSource.onopen = () => {
      retryCount = 0;
      handlers.onStatus('connected');
    };

    nextSource.addEventListener('message', handleMessage);

    nextSource.onerror = (error: Event) => {
      handlers.onError?.(error);
      closeSource(nextSource);

      if (closed) return;

      retryCount += 1;
      if (retryCount > MAX_RETRIES) {
        handlers.onStatus('fallback');
        return;
      }

      clearRetryTimer();
      const delay = getBackoffMs(retryCount - 1);
      retryTimer = setTimeout(connect, delay);
    };
  }

  connect();

  return () => {
    closed = true;
    clearRetryTimer();
    closeSource(source);
  };
}
