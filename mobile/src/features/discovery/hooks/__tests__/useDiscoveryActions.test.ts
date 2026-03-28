import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createQueryTestHarness } from '../../../../lib/testing/queryTestHarness';
import { queryKeys } from '../../../../lib/query/queryKeys';
import { useDiscoveryActions } from '../useDiscoveryActions';

const mockLike = jest.fn();
const mockPass = jest.fn();

jest.mock('../../../../services/api', () => ({
  discoveryApi: {
    like: (...args: unknown[]) => mockLike(...args),
    pass: (...args: unknown[]) => mockPass(...args),
  },
}));

describe('useDiscoveryActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('optimistically removes passed user from all feed caches', async () => {
    mockPass.mockResolvedValue({ data: { status: 'passed' } });
    const { queryClient, wrapper } = createQueryTestHarness();
    const defaultKey = queryKeys.discovery.feed();
    const filteredKey = queryKeys.discovery.feed({ distanceKm: 10 });

    queryClient.setQueryData(defaultKey, [
      { id: 'user-2', firstName: 'Lana' },
      { id: 'user-3', firstName: 'Mason' },
    ]);
    queryClient.setQueryData(filteredKey, [
      { id: 'user-2', firstName: 'Lana' },
      { id: 'user-3', firstName: 'Mason' },
    ]);

    const { result } = renderHook(() => useDiscoveryActions(), { wrapper });

    await act(async () => {
      await result.current.passUser('user-2');
    });

    expect(queryClient.getQueryData(defaultKey)).toEqual([
      { id: 'user-3', firstName: 'Mason' },
    ]);
    expect(queryClient.getQueryData(filteredKey)).toEqual([
      { id: 'user-3', firstName: 'Mason' },
    ]);
  });

  it('invalidates matches when an external like creates a match', async () => {
    mockLike.mockResolvedValue({
      data: { status: 'match', match: { id: 'match-1' } },
    });
    const { queryClient, wrapper } = createQueryTestHarness();
    const invalidateSpy = jest
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(undefined as never);

    const { result } = renderHook(() => useDiscoveryActions(), { wrapper });

    await act(async () => {
      await result.current.likeUser('user-2');
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.matches.list(),
      });
    });
  });

  it('restores cached discovery feeds when an external swipe fails', async () => {
    mockLike.mockRejectedValue(new Error('Like failed'));
    const { queryClient, wrapper } = createQueryTestHarness();
    jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined as never);
    const defaultKey = queryKeys.discovery.feed();
    const filteredKey = queryKeys.discovery.feed({ distanceKm: 10 });
    const users = [
      { id: 'user-2', firstName: 'Lana' },
      { id: 'user-3', firstName: 'Mason' },
    ];

    queryClient.setQueryData(defaultKey, users);
    queryClient.setQueryData(filteredKey, users);

    const { result } = renderHook(() => useDiscoveryActions(), { wrapper });

    await act(async () => {
      await expect(result.current.likeUser('user-2')).rejects.toThrow('Like failed');
    });

    expect(queryClient.getQueryData(defaultKey)).toEqual(users);
    expect(queryClient.getQueryData(filteredKey)).toEqual(users);
  });
});
