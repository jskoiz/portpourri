import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createQueryTestHarness } from '../../../../lib/testing/queryTestHarness';
import { queryKeys } from '../../../../lib/query/queryKeys';
import { useDiscoveryFeed } from '../useDiscoveryFeed';

const mockFeed = jest.fn();
const mockLike = jest.fn();
const mockPass = jest.fn();
const mockUndo = jest.fn();

jest.mock('../../../../services/api', () => ({
  discoveryApi: {
    feed: (...args: unknown[]) => mockFeed(...args),
    like: (...args: unknown[]) => mockLike(...args),
    pass: (...args: unknown[]) => mockPass(...args),
    undo: (...args: unknown[]) => mockUndo(...args),
  },
}));

describe('useDiscoveryFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns feed data on success', async () => {
    const users = [
      { id: 'u1', firstName: 'Alice' },
      { id: 'u2', firstName: 'Bob' },
    ];
    mockFeed.mockResolvedValue({ data: users });

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useDiscoveryFeed(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.feed).toEqual(users);
  });

  it('returns empty feed on API error', async () => {
    mockFeed.mockRejectedValue(new Error('Network error'));

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useDiscoveryFeed(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.feed).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });

  it('starts in loading state', () => {
    mockFeed.mockReturnValue(new Promise(() => {}));

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useDiscoveryFeed(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.feed).toEqual([]);
  });

  it('passes filters to the API', async () => {
    mockFeed.mockResolvedValue({ data: [] });
    const filters = { distanceKm: 10, goals: ['strength'] };

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useDiscoveryFeed(filters), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFeed).toHaveBeenCalledWith(filters);
  });

  it('invalidates discovery and match caches when undoing a swipe', async () => {
    mockFeed.mockResolvedValue({ data: [] });
    mockUndo.mockResolvedValue({ data: { restoredUserId: 'u1' } });

    const { queryClient, wrapper } = createQueryTestHarness();
    const invalidateSpy = jest
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(undefined as never);

    const { result } = renderHook(() => useDiscoveryFeed({ distanceKm: 10 }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.undoSwipe();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.discovery.feedFamily,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.matches.list,
    });
  });
});
