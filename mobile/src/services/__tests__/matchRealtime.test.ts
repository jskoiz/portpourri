import * as SecureStore from 'expo-secure-store';
import { env } from '../../config/env';
import { connectMatchMessageStream } from '../matchRealtime';
import { STORAGE_KEYS } from '../../constants/storage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
}));

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

class MockEventSource {
  static instances: MockEventSource[] = [];

  public onopen: (() => void) | null = null;
  public onerror: ((error: Event) => void) | null = null;
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

  close() {
    return undefined;
  }
}

describe('connectMatchMessageStream', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockEventSource.instances = [];
    (globalThis as unknown as { EventSource: typeof MockEventSource }).EventSource = MockEventSource;
  });

  it('uses the secure-store token when opening the realtime stream', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce('secure-token');
    const onStatus = jest.fn();

    const disconnect = await connectMatchMessageStream('match-1', {
      onMessage: jest.fn(),
      onStatus,
    });

    expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.accessToken);
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toBe(
      `${env.apiUrl}/matches/match-1/messages/stream?token=secure-token`,
    );
    expect(MockEventSource.instances[0].init).toMatchObject({});
    expect(onStatus).toHaveBeenCalledWith('connecting');

    disconnect();
  });

  it('falls back immediately when no token is available', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce(null);
    const onStatus = jest.fn();

    const disconnect = await connectMatchMessageStream('match-1', {
      onMessage: jest.fn(),
      onStatus,
    });

    expect(MockEventSource.instances).toHaveLength(0);
    expect(onStatus).toHaveBeenCalledWith('fallback');

    disconnect();
  });
});
