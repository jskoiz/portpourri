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
  useMutation: ({ mutationFn, onMutate }: { mutationFn: (text: string) => Promise<unknown>; onMutate: (text: string) => Promise<unknown> }) => ({
    mutateAsync: async (text: string) => {
      await onMutate?.(text);
      return mutationFn(text);
    },
    isPending: false,
  }),
}));

describe('useChatThread', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSocketConnected = false;
    mockSocket.connected = false;
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
      expect(mockConnectSocket).toHaveBeenCalled();
    });

    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith('leave:match', { matchId: 'match-1' });
    expect(mockSocket.off).toHaveBeenCalledWith('connect');
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect');
    expect(mockSocket.off).toHaveBeenCalledWith('message:new');
    expect(mockSocket.off).toHaveBeenCalledWith('typing:start');
    expect(mockSocket.off).toHaveBeenCalledWith('typing:stop');
    expect(mockSocket.off).toHaveBeenCalledWith('connect_error');
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
});
