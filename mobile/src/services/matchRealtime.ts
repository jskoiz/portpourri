import { env } from '../config/env';
import { getToken } from '../api/tokenStorage';
export { connectSocket, disconnectSocket } from '../lib/socket';

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
const MAX_DEDUPED_MESSAGE_IDS = 200;

function getBackoffMs(attempt: number): number {
  return Math.min(1_000 * Math.pow(2, attempt), MAX_BACKOFF_MS);
}

function getMessageIdentity(payload: MessageEventPayload): string {
  return `${payload.matchId}:${payload.message.id}`;
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

  let retryCount = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;
  let source: EventSource | null = null;
  let connectionGeneration = 0;
  const deliveredMessageIds = new Set<string>();
  const deliveredMessageQueue: string[] = [];

  function clearRetryTimer() {
    if (!retryTimer) return;
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  function rememberDeliveredMessageId(messageId: string) {
    if (deliveredMessageIds.has(messageId)) return;

    deliveredMessageIds.add(messageId);
    deliveredMessageQueue.push(messageId);

    if (deliveredMessageQueue.length > MAX_DEDUPED_MESSAGE_IDS) {
      const staleMessageId = deliveredMessageQueue.shift();
      if (staleMessageId) {
        deliveredMessageIds.delete(staleMessageId);
      }
    }
  }

  const handleMessage = (event: Event) => {
    try {
      const payload = JSON.parse((event as MessageEvent).data as string) as MessageEventPayload;
      if (
        payload.type !== 'message' ||
        payload.matchId !== matchId ||
        !payload.message ||
        typeof payload.message.id !== 'string'
      ) {
        return;
      }

      const messageIdentity = getMessageIdentity(payload);
      if (deliveredMessageIds.has(messageIdentity)) {
        return;
      }

      rememberDeliveredMessageId(messageIdentity);
      handlers.onMessage(payload);
    } catch (error) {
      handlers.onError?.(error);
    }
  };

  function closeSource(target: EventSource | null) {
    if (!target) return;

    target.removeEventListener?.('message', handleMessage);
    target.onopen = null;
    target.onerror = null;
    target.onmessage = null;
    target.close();

    if (source === target) {
      source = null;
    }
  }

  async function connect() {
    if (closed) return;
    clearRetryTimer();
    const generation = ++connectionGeneration;

    handlers.onStatus('connecting');

    let token: string | null = null;
    try {
      token = await getToken();
    } catch (error) {
      if (!closed && generation === connectionGeneration) {
        handlers.onError?.(error);
        handlers.onStatus('fallback');
      }
      return;
    }

    if (closed || generation !== connectionGeneration) {
      return;
    }

    if (!token) {
      handlers.onStatus('fallback');
      return;
    }

    const streamUrl = `${env.apiUrl}/matches/${matchId}/messages/stream`;
    // TODO: Replace the long-lived access token with a short-lived, scoped
    // connection token to limit exposure in URL/query-string logs. For now the
    // backend JWT strategy accepts `token` as a query parameter fallback since
    // EventSource does not support custom headers.
    const urlWithToken = `${streamUrl}${streamUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
    const nextSource = new EventSourceCtor!(urlWithToken, {} as EventSourceInit);
    source = nextSource;

    nextSource.onopen = () => {
      if (closed || generation !== connectionGeneration) {
        closeSource(nextSource);
        return;
      }

      retryCount = 0;
      handlers.onStatus('connected');
    };

    nextSource.addEventListener('message', handleMessage);

    nextSource.onerror = (error: Event) => {
      if (closed || generation !== connectionGeneration) {
        closeSource(nextSource);
        return;
      }

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
      retryTimer = setTimeout(() => {
        if (!closed && generation === connectionGeneration) {
          void connect();
        }
      }, delay);
    };
  }

  await connect();

  return () => {
    closed = true;
    connectionGeneration += 1;
    clearRetryTimer();
    closeSource(source);
  };
}
