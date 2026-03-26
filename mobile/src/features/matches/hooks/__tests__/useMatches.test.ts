import { renderHook, waitFor } from '@testing-library/react-native';
import { createQueryTestHarness } from '../../../../lib/testing/queryTestHarness';
import { useMatches } from '../useMatches';
import { clearBlockedUserIds, registerBlockedUserId } from '../../../../lib/moderation/blockedUsers';

const mockList = jest.fn();

jest.mock('../../../../services/api', () => ({
  matchesApi: {
    list: (...args: unknown[]) => mockList(...args),
  },
}));

describe('useMatches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearBlockedUserIds();
  });

  it('returns matches on success', async () => {
    const matches = [
      { id: 'm1', user: { id: 'u1', firstName: 'Alice' } },
    ];
    mockList.mockResolvedValue({ data: matches });

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useMatches(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.matches).toEqual(matches);
  });

  it('returns empty array on API failure', async () => {
    mockList.mockRejectedValue(new Error('Network error'));

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useMatches(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.matches).toEqual([]);
  });

  it('starts in loading state', () => {
    mockList.mockReturnValue(new Promise(() => {}));

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useMatches(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.matches).toEqual([]);
  });

  it('filters blocked users out of matches', async () => {
    registerBlockedUserId('u2');
    mockList.mockResolvedValue({
      data: [
        { id: 'm1', user: { id: 'u1', firstName: 'Alice' } },
        { id: 'm2', user: { id: 'u2', firstName: 'Blocked' } },
      ],
    });

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useMatches(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.matches).toEqual([
      { id: 'm1', user: { id: 'u1', firstName: 'Alice' } },
    ]);
  });
});
