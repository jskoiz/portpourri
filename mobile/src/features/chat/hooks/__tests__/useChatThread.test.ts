import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useChatThread } from '../useChatThread';

const mockGetMessages = jest.fn().mockResolvedValue({ data: [] });
const mockSendMessage = jest.fn().mockResolvedValue({
  data: { id: 'msg-1', text: 'hi', sender: 'me', timestamp: '2026-03-17T00:00:00Z' },
});

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

const mockRefetch = jest.fn().mockResolvedValue({ data: [] });
const mockCancelQueries = jest.fn().mockResolvedValue(undefined);
const mockInvalidateQueries = jest.fn().mockResolvedValue(undefined);
const mockSetQueryData = jest.fn();
const mockGetQueryData = jest.fn().mockReturnValue([]);
const mockGetQueriesData = jest.fn().mockImplementation(({ queryKey }: { queryKey: unknown }) => [
  [queryKey, mockGetQueryData(queryKey)],
]);

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
    invalidateQueries: mockInvalidateQueries,
    setQueryData: mockSetQueryData,
    getQueryData: mockGetQueryData,
    getQueriesData: mockGetQueriesData,
  }),
  useMutation: ({
    mutationFn,
    onMutate,
    onError,
    onSuccess,
    onSettled,
  }: {
    mutationFn: (text: string) => Promise<unknown>;
    onMutate?: (text: string) => Promise<unknown>;
    onError?: (error: unknown, text: string, context: unknown) => void;
    onSuccess?: (result: unknown, text: string, context: unknown) => void;
    onSettled?: (result: unknown, error: unknown, text: string, context: unknown) => void;
  }) => ({
    mutateAsync: async (text: string) => {
      const context = await onMutate?.(text);

      try {
        const result = await mutationFn(text);
        onSuccess?.(result, text, context);
        onSettled?.(result, null, text, context);
        return result;
      } catch (error) {
        onError?.(error, text, context);
        onSettled?.(undefined, error, text, context);
        throw error;
      }
    },
    isPending: false,
  }),
}));

function getSocketHandler(eventName: string) {
  return mockSocketOn.mock.calls.find(([registered]) => registered === eventName)?.[1];
}

function countSocketEmits(eventName: string) {
  return mockSocketEmit.mock.calls.filter(([registered]) => registered === eventName).length;
}

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
    mockDisconnectSocket.mockImplementation(() => {
      mockGetSocket.mockReturnValue(null);
    });
    mockConnectSocket.mockResolvedValue(mockSocket);
    mockConnectMatchMessageStream.mockResolvedValue(() => {});
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

  it('falls back to SSE when WebSocket setup fails', async () => {
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

  it('disconnects the websocket transport when connect_error triggers fallback', async () => {
    renderHook(() => useChatThread('match-1'));

    await waitFor(() => {
      expect(getSocketHandler('connect_error')).toEqual(expect.any(Function));
    });

    act(() => {
      getSocketHandler('connect_error')?.();
    });

    expect(mockDisconnectSocket).toHaveBeenCalled();
    expect(mockConnectMatchMessageStream).toHaveBeenCalledWith(
      'match-1',
      expect.objectContaining({
        onMessage: expect.any(Function),
        onStatus: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  it('cleans up socket listeners on unmount', async () => {
    const { unmount } = renderHook(() => useChatThread('match-1'));

    await waitFor(() => {
      expect(getSocketHandler('joined:match')).toEqual(expect.any(Function));
    });

    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith('leave:match', { matchId: 'match-1' });
    expect(mockSocket.off).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('reconnect', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('joined:match', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('message:new', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('typing:start', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('typing:stop', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockDisconnectSocket).toHaveBeenCalled();
  });

  it('emits typing start once, debounces typing stop, and re-arms after disconnect', async () => {
    mockSocket.connected = true;
    mockGetSocket.mockReturnValue(mockSocket);

    const { result } = renderHook(() => useChatThread('match-1'));

    await waitFor(() => {
      expect(mockConnectSocket).toHaveBeenCalled();
    });

    act(() => {
      getSocketHandler('joined:match')?.({ matchId: 'match-1' });
      result.current.emitTyping();
      result.current.emitTyping();
    });

    expect(countSocketEmits('typing:start')).toBe(1);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(countSocketEmits('typing:stop')).toBe(1);

    act(() => {
      mockSocket.connected = false;
      getSocketHandler('disconnect')?.();
    });

    act(() => {
      mockSocket.connected = true;
      getSocketHandler('joined:match')?.({ matchId: 'match-1' });
      result.current.emitTyping();
    });

    expect(countSocketEmits('typing:start')).toBe(2);
  });

  it('dedupes repeated realtime delivery for the same message id', async () => {
    renderHook(() => useChatThread('match-1'));

    await waitFor(() => {
      expect(getSocketHandler('message:new')).toEqual(expect.any(Function));
    });

    const messageHandler = getSocketHandler('message:new');
    if (!messageHandler) {
      throw new Error('Expected message:new handler to be registered');
    }

    act(() => {
      messageHandler({
        matchId: 'match-1',
        message: {
          id: 'msg-1',
          text: 'Hello',
          sender: 'them',
          timestamp: '2026-03-17T00:00:00Z',
        },
      });
    });

    expect(mockRefetch).toHaveBeenCalledTimes(1);

    act(() => {
      messageHandler({
        matchId: 'match-1',
        message: {
          id: 'msg-1',
          text: 'Hello',
          sender: 'them',
          timestamp: '2026-03-17T00:00:00Z',
        },
      });
    });

    expect(mockRefetch).toHaveBeenCalledTimes(1);

    act(() => {
      messageHandler({
        matchId: 'match-1',
        message: {
          id: 'msg-2',
          text: 'World',
          sender: 'them',
          timestamp: '2026-03-17T00:00:01Z',
        },
      });
    });

    expect(mockRefetch).toHaveBeenCalledTimes(2);
  });

  it('reconciles a sent message after a refetch removes the optimistic temp row', async () => {
    mockGetQueryData.mockReturnValueOnce([
      {
        id: 'existing-1',
        text: 'Earlier',
        sender: 'them',
        timestamp: '2026-03-17T00:00:00Z',
      },
    ]);
    mockSetQueryData.mockImplementation((_queryKey, updater) => {
      if (typeof updater !== 'function') {
        return updater;
      }

      return updater([
        {
          id: 'existing-1',
          text: 'Earlier',
          sender: 'them',
          timestamp: '2026-03-17T00:00:00Z',
        },
      ]);
    });

    const { result } = renderHook(() => useChatThread('match-1'));

    await act(async () => {
      await result.current.sendMessage('hi');
    });

    const reconciliationCall = mockSetQueryData.mock.calls.at(-1);
    expect(reconciliationCall).toBeDefined();

    const reconciled = reconciliationCall?.[1]([
      {
        id: 'existing-1',
        text: 'Earlier',
        sender: 'them',
        timestamp: '2026-03-17T00:00:00Z',
      },
    ]);

    expect(reconciled).toEqual([
      { id: 'msg-1', text: 'hi', sender: 'me', timestamp: '2026-03-17T00:00:00Z' },
      {
        id: 'existing-1',
        text: 'Earlier',
        sender: 'them',
        timestamp: '2026-03-17T00:00:00Z',
      },
    ]);
  });

  it('joins match room when socket is already connected and re-joins after reconnects without duplicating requests', async () => {
    mockSocket.connected = true;
    mockConnectSocket.mockResolvedValue(mockSocket);

    renderHook(() => useChatThread('match-1'));

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('join:match', { matchId: 'match-1' });
    });

    const initialJoinCount = countSocketEmits('join:match');

    act(() => {
      getSocketHandler('connect')?.();
    });

    expect(countSocketEmits('join:match')).toBe(initialJoinCount);

    act(() => {
      getSocketHandler('joined:match')?.({ matchId: 'match-1' });
      mockSocket.connected = false;
      getSocketHandler('disconnect')?.();
      mockSocket.connected = true;
      getSocketHandler('reconnect')?.();
    });

    expect(countSocketEmits('join:match')).toBe(initialJoinCount + 1);
  });

  it('does not skip mount when matchId is empty', () => {
    const { result } = renderHook(() => useChatThread(''));

    expect(result.current.messages).toEqual([]);
    expect(mockConnectSocket).not.toHaveBeenCalled();
  });

  it('emits typing:stop on unmount when a typing session is active', async () => {
    mockSocket.connected = true;
    mockGetSocket.mockReturnValue(mockSocket);

    const { result, unmount } = renderHook(() => useChatThread('match-1'));

    await waitFor(() => {
      expect(mockConnectSocket).toHaveBeenCalled();
    });

    act(() => {
      getSocketHandler('joined:match')?.({ matchId: 'match-1' });
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
