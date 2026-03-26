import { connectMatchMessageStream } from '../matchRealtime';
import { connectSocket, disconnectSocket } from '../matchRealtime';
import { getToken } from '../../api/tokenStorage';
import { env } from '../../config/env';

jest.mock('../../api/tokenStorage', () => ({
  getToken: jest.fn(),
}));

const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

const mockIo = jest.fn();

jest.mock('socket.io-client', () => ({
  io: (...args: unknown[]) => mockIo(...args),
}));

class MockEventSource {
  static instances: MockEventSource[] = [];

  public onopen: (() => void) | null = null;
  public onerror: ((error: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public listeners = new Map<string, (event: MessageEvent) => void>();

  constructor(
    public url: string,
    public init?: EventSourceInit,
  ) {
    MockEventSource.instances.push(this);
  }

  addEventListener(eventName: string, listener: (event: MessageEvent) => void) {
    this.listeners.set(eventName, listener);
  }

  removeEventListener(
    eventName: string,
    listener?: (event: MessageEvent) => void,
    options?: boolean | AddEventListenerOptions,
  ) {
    void listener;
    void options;
    this.listeners.delete(eventName);
  }

  emitOpen() {
    this.onopen?.();
  }

  emitError(error: Event = new Event('error')) {
    this.onerror?.(error);
  }

  emitMessage(payload: unknown) {
    const event = { data: JSON.stringify(payload) } as MessageEvent;
    this.listeners.get('message')?.(event);
    this.onmessage?.(event);
  }

  close() {
    return undefined;
  }
}

describe('realtime transport helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    MockEventSource.instances = [];
    (globalThis as unknown as { EventSource: typeof MockEventSource }).EventSource = MockEventSource;
    mockGetToken.mockReset();
    disconnectSocket();
  });

  afterEach(() => {
    disconnectSocket();
    jest.useRealTimers();
  });

  it('retries SSE with a fresh token and deduplicates repeated message ids', async () => {
    mockGetToken
      .mockResolvedValueOnce('secure-token-1')
      .mockResolvedValueOnce('secure-token-2');
    const onMessage = jest.fn();
    const onStatus = jest.fn();

    const disconnect = await connectMatchMessageStream('match-1', {
      onMessage,
      onStatus,
    });

    expect(mockGetToken).toHaveBeenCalledTimes(1);
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toBe(
      `${env.apiUrl}/matches/match-1/messages/stream?token=secure-token-1`,
    );

    MockEventSource.instances[0].emitOpen();
    expect(onStatus).toHaveBeenCalledWith('connected');

    const message = {
      type: 'message' as const,
      matchId: 'match-1',
      message: {
        id: 'msg-1',
        text: 'hello',
        sender: 'them' as const,
        timestamp: '2026-03-25T00:00:00.000Z',
      },
    };

    MockEventSource.instances[0].emitMessage(message);
    expect(onMessage).toHaveBeenCalledTimes(1);

    MockEventSource.instances[0].emitError();

    await jest.advanceTimersByTimeAsync(1000);

    expect(mockGetToken).toHaveBeenCalledTimes(2);
    expect(MockEventSource.instances).toHaveLength(2);
    expect(MockEventSource.instances[1].url).toBe(
      `${env.apiUrl}/matches/match-1/messages/stream?token=secure-token-2`,
    );

    MockEventSource.instances[1].emitOpen();
    expect(onStatus).toHaveBeenCalledWith('connected');

    MockEventSource.instances[1].emitMessage(message);
    expect(onMessage).toHaveBeenCalledTimes(1);

    MockEventSource.instances[1].emitMessage({
      ...message,
      message: { ...message.message, id: 'msg-2', text: 'follow-up' },
    });
    expect(onMessage).toHaveBeenCalledTimes(2);

    disconnect();
  });

  it('cancels a pending SSE reconnect when disconnected', async () => {
    mockGetToken.mockResolvedValueOnce('secure-token');
    const onMessage = jest.fn();
    const onStatus = jest.fn();

    const disconnect = await connectMatchMessageStream('match-1', {
      onMessage,
      onStatus,
    });

    expect(MockEventSource.instances).toHaveLength(1);

    MockEventSource.instances[0].emitError();
    disconnect();

    await jest.advanceTimersByTimeAsync(2000);

    expect(MockEventSource.instances).toHaveLength(1);
    expect(onStatus).not.toHaveBeenCalledWith('fallback');
  });

  it('falls back immediately when no token is available', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const onMessage = jest.fn();
    const onStatus = jest.fn();

    await connectMatchMessageStream('match-1', {
      onMessage,
      onStatus,
    });

    expect(MockEventSource.instances).toHaveLength(0);
    expect(onStatus).toHaveBeenCalledWith('fallback');
  });

  it('uses the same socket instance for repeated connections with the same token', async () => {
    const socketInstance = {
      connected: true,
      disconnect: jest.fn(),
      removeAllListeners: jest.fn(),
    } as unknown as import('socket.io-client').Socket;

    mockIo.mockReturnValue(socketInstance as never);

    const first = await connectSocket('socket-token');
    const second = await connectSocket('socket-token');

    expect(first).toBe(socketInstance);
    expect(second).toBe(socketInstance);
    expect(mockIo).toHaveBeenCalledTimes(1);

    disconnectSocket();

    expect(socketInstance.removeAllListeners).toHaveBeenCalledTimes(1);
    expect(socketInstance.disconnect).toHaveBeenCalledTimes(1);
  });
});
