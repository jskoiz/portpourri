import { renderHook, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { createQueryTestHarness } from '../../../../lib/testing/queryTestHarness';
import { useBlock } from '../useBlock';
import { queryKeys } from '../../../../lib/query/queryKeys';

const mockBlock = jest.fn();

jest.mock('../../../../services/api', () => ({
  moderationApi: {
    block: (...args: unknown[]) => mockBlock(...args),
  },
}));

jest.spyOn(Alert, 'alert');

describe('useBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls moderationApi.block with the correct payload', async () => {
    mockBlock.mockResolvedValue({ data: { success: true, matchId: 'match-1' } });

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useBlock(), { wrapper });

    await act(async () => {
      await result.current.block({ targetUserId: 'u1' });
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockBlock).toHaveBeenCalledWith({ targetUserId: 'u1' });
  });

  it('invalidates matches query on success', async () => {
    mockBlock.mockResolvedValue({ data: { success: true, matchId: 'match-1' } });

    const { wrapper, queryClient } = createQueryTestHarness();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useBlock(), { wrapper });

    await act(async () => {
      await result.current.block({ targetUserId: 'u1' });
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.matches.list() }),
    );
  });

  it('shows success alert on block', async () => {
    mockBlock.mockResolvedValue({ data: { success: true, matchId: 'match-1' } });

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useBlock(), { wrapper });

    await act(async () => {
      await result.current.block({ targetUserId: 'u1' });
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(Alert.alert).toHaveBeenCalledWith(
      'User blocked',
      expect.any(String),
    );
  });

  it('calls onSuccess callback after blocking', async () => {
    mockBlock.mockResolvedValue({ data: { success: true, matchId: 'match-1' } });
    const onSuccess = jest.fn();

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useBlock({ onSuccess }), { wrapper });

    await act(async () => {
      await result.current.block({ targetUserId: 'u1' });
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows error alert on failed block', async () => {
    mockBlock.mockRejectedValue(new Error('Server error'));

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useBlock(), { wrapper });

    await act(async () => {
      try {
        await result.current.block({ targetUserId: 'u1' });
      } catch {
        // expected
      }
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Could not block user',
      expect.any(String),
    );
  });

  it('passes matchId when provided', async () => {
    mockBlock.mockResolvedValue({ data: { success: true, matchId: 'match-1' } });

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useBlock(), { wrapper });

    await act(async () => {
      await result.current.block({ targetUserId: 'u1', matchId: 'm1' });
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockBlock).toHaveBeenCalledWith({ targetUserId: 'u1', matchId: 'm1' });
  });
});
