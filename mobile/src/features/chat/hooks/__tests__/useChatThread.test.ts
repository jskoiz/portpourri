import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useChatThread } from '../useChatThread';

// ---- Mocks ----

const mockGetMessages = jest.fn().mockResolvedValue({ data: [] });
const mockSendMessage = jest.fn().mockResolvedValue({ data: { id: 'msg-1', text: 'hi', sender: 'me', timestamp: '2026-03-17T00:00:00Z' } });

jest.mock('../../../../services/api', () => ({
  matchesApi: {
    getMessages: (...args: unknown[]) => mockGetMessages(...args),
    sendMessage: (...args: unknown[]) => mockSendMessage(...args),
  },
}));

const mockConnectMatchMessageStream = jest.fn().mockResolvedValue(() => {});

jest.mock('../../../../services/matchRealtime', () => ({
  connectMatchMessageStream: (...args: unknown[]) => mockConnectMatchMessageStream(...args),
}));

const mockSocketOn = jest.fn();
const mockSocketOff = jest.fn();
const mockSocketEmit = jest.fn();
const mockSocketDisconnect = jest.fn();
const mockSocketHandlers = new Map<string, (...args: unknown[]) => void>();
let mockSocketConnected = false;

const mockSocket = {
  connected: mockSocketConnected,
  on: mockSocketOn,
  off: mockSocketOff,
  emit: mockSocketEmit,
  disconnect: mockSocketDisconnect,
};

const mockConnectSocket = jest.fn();
const mockGetSocket = jest.fn();
const mockDisconnectSocket = jest.fn();

jest.mock('../../../../lib/socket', () => ({
  connectSocket: (...args: unknown[]) => mockConnectSocket(...args),
  getSocket: () => mockGetSocket(),
  disconnectSocket: () => mockDisconnectSocket(),
}));

jest.mock('../../../../lib/query/queryKeys', () => ({
  queryKeys: {
    matches: {
      messages: (matchId: string) => ['matches', 'messages', matchId],
    },
  },
}));

// Mock React Query
const mockRefetch = jest.fn().mockResolvedValue({ data: [] });
const mockCancelQueries = jest.fn().mockResolvedValue(undefined);
const mockSetQueryData = jest.fn();
const mockGetQueryData = jest.fn().mockReturnValue([]);

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: [],
    isLoading: false,
    isRefetching: false,
    error: null,
    refetch: mockRefetch,
  }),
  useQueryClient: () => ({
    cancelQueries: mockCancelQueries,
    setQueryData: mockSetQueryData,
    getQueryData: mockGetQueryData,
  }),
  useMutation: ({
    mutationFn,
    onMutate,
    onError,
    onSuccess,
  }: {
    mutationFn: (text: string) => Promise<unknown>;
    onMutate?: (text: string) => Promise<unknown>;
    onError?: (error: unknown, text: string, context: unknown) => void;
    onSuccess?: (result: unknown, text: string, context: unknown) => void;
  }) => ({
    mutateAsync: async (text: string) => {
      const context = await onMutate?.(text);
      try {
        const result = await mutationFn(text);
        onSuccess?.(result, text, context);
        return result;
      } catch (error) {
        onError?.(error, text, context);
        throw error;
      }
    },
    isPending: false,
  }),
}));

describe('useChatThread', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSocketHandlers.clear();
    mockSocketConnected = false;
    mockSocket.connected = false;
    mockSocketOn.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
      mockSocketHandlers.set(event, handler);
    });
    mockSocketOff.mockImplementation((event: string) => {
      mockSocketHandlers.delete(event);
    });
    mockGetSocket.mockReturnValue(mockSocket);
    mockConnectSocket.mockResolvedValue(mockSocket);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns initial state with connecting status', () => {
    const { result } = renderHook(() => useChatThread('match-1'));

    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.isTyping).toBe(false);
    expect(result.current.connectionStatus).toBe('connecting');
  });

  it('attempts WebSocket connection on mount', async () => {
    renderHook(() => useChatThread('match-1'));

    await waitFor(() => {
      expect(mockConnectSocket).toHaveBeenCalled();
    });
  });

  it('falls back to SSE when WebSocket connection fails', async () => {
    mockConnectSocket.mockRejectedValueOnce(new Error('WS failed'));

    renderHook(() => useChatThread('match-1'));

    await waitFor(() => {
      expect(mockConnectMatchMessageStream).toHaveBeenCalledWith(
        'match-1',
        expect.objectContaining({
          onMessage: expect.any(Function),
          onStatus: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
    });
  });

  it('cleans up socket listeners on unmount', async () => {
    const { unmount } = renderHook(() => useChatThread('match-1'));

    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    });

    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith('leave:match', { matchId: 'match-1' });
    expect(mockSocket.off).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('reconnect', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('message:new', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('typing:start', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('typing:stop', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockSocket.off).not.toHaveBeenCalledWith('connect');
    expect(mockSocket.off).not.toHaveBeenCalledWith('disconnect');
    expect(mockSocket.off).not.toHaveBeenCalledWith('reconnect');
    expect(mockSocket.off).not.toHaveBeenCalledWith('message:new');
    expect(mockSocket.off).not.toHaveBeenCalledWith('typing:start');
    expect(mockSocket.off).not.toHaveBeenCalledWith('typing:stop');
    expect(mockSocket.off).not.toHaveBeenCalledWith('connect_error');
  });

  it('exposes emitTyping that emits to socket', async () => {
    mockSocket.connected = true;
    mockGetSocket.mockReturnValue(mockSocket);

    const { result } = renderHook(() => useChatThread('match-1'));

    // Wait for async WS setup to settle
    await waitFor(() => {
      expect(mockConnectSocket).toHaveBeenCalled();
    });

    act(() => {
      result.current.emitTyping();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('typing:start', { matchId: 'match-1' });
  });

  it('does not skip mount when matchId is empty', () => {
    const { result } = renderHook(() => useChatThread(''));

    expect(result.current.messages).toEqual([]);
    expect(mockConnectSocket).not.toHaveBeenCalled();
  });

  it('joins match room when socket is already connected', async () => {
    mockSocket.connected = true;
    mockConnectSocket.mockResolvedValue(mockSocket);

    renderHook(() => useChatThread('match-1'));

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('join:match', { matchId: 'match-1' });
    });
  });

  it('does not keep polling when the socket is already connected', async () => {
    mockSocket.connected = true;
    mockConnectSocket.mockResolvedValue(mockSocket);

    renderHook(() => useChatThread('match-1'));

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('join:match', { matchId: 'match-1' });
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it('writes incoming websocket messages into cache instead of refetching', async () => {
    renderHook(() => useChatThread('match-1'));

    await waitFor(() => {
      expect(mockSocketHandlers.get('message:new')).toEqual(expect.any(Function));
    });

    act(() => {
      mockSocketHandlers.get('message:new')?.({
        matchId: 'match-1',
        message: {
          id: 'msg-2',
          text: 'new message',
          sender: 'them',
          timestamp: '2026-03-17T00:01:00Z',
        },
      });
    });

    expect(mockSetQueryData).toHaveBeenCalledWith(
      ['matches', 'messages', 'match-1'],
      expect.any(Function),
    );
    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it('replaces the optimistic message without refetching after send', async () => {
    const { result } = renderHook(() => useChatThread('match-1'));

    await act(async () => {
      await result.current.sendMessage('hi');
    });

    expect(mockSendMessage).toHaveBeenCalledWith('match-1', 'hi');
    expect(mockSetQueryData).toHaveBeenCalledWith(
      ['matches', 'messages', 'match-1'],
      expect.any(Function),
    );
    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it('emits typing:stop on unmount when a typing session is active', async () => {
    mockSocket.connected = true;
    mockGetSocket.mockReturnValue(mockSocket);

    const { result, unmount } = renderHook(() => useChatThread('match-1'));

    await waitFor(() => {
      expect(mockConnectSocket).toHaveBeenCalled();
    });

    act(() => {
      result.current.emitTyping();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('typing:start', { matchId: 'match-1' });

    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith('typing:stop', { matchId: 'match-1' });
  });

  it('disconnects a late websocket connection when the thread unmounts first', async () => {
    mockGetSocket.mockReturnValue(null);

    let resolveSocket!: (socket: typeof mockSocket) => void;
    mockConnectSocket.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSocket = resolve;
      }) as Promise<typeof mockSocket>,
    );

    const { unmount } = renderHook(() => useChatThread('match-1'));

    unmount();

    await act(async () => {
      resolveSocket(mockSocket);
      await Promise.resolve();
    });

    expect(mockSocketDisconnect).toHaveBeenCalled();
  });

  it('closes a late SSE connection when the thread unmounts first', async () => {
    mockConnectSocket.mockRejectedValueOnce(new Error('WS failed'));

    let resolveDisconnect!: (disconnect: () => void) => void;
    mockConnectMatchMessageStream.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveDisconnect = resolve;
      }) as Promise<() => void>,
    );

    const { unmount } = renderHook(() => useChatThread('match-1'));

    await waitFor(() => {
      expect(mockConnectMatchMessageStream).toHaveBeenCalled();
    });

    unmount();

    const sseDisconnect = jest.fn();
    await act(async () => {
      resolveDisconnect(sseDisconnect);
      await Promise.resolve();
    });

    expect(sseDisconnect).toHaveBeenCalled();
  });
});
