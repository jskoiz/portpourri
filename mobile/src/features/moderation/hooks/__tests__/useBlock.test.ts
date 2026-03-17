import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import React from 'react';
import { useBlock } from '../useBlock';
import { queryKeys } from '../../../../lib/query/queryKeys';

const mockBlock = jest.fn();

jest.mock('../../../../services/api', () => ({
  moderationApi: {
    block: (...args: unknown[]) => mockBlock(...args),
  },
}));

jest.spyOn(Alert, 'alert');

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children),
    queryClient,
  };
}

describe('useBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls moderationApi.block with the correct payload', async () => {
    mockBlock.mockResolvedValue({ data: { status: 'blocked' } });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBlock(), { wrapper });

    await act(async () => {
      await result.current.block({ blockedUserId: 'u1' });
    });

    expect(mockBlock).toHaveBeenCalledWith({ blockedUserId: 'u1' });
  });

  it('invalidates matches query on success', async () => {
    mockBlock.mockResolvedValue({ data: { status: 'blocked' } });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useBlock(), { wrapper });

    await act(async () => {
      await result.current.block({ blockedUserId: 'u1' });
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.matches.list }),
    );
  });

  it('shows success alert on block', async () => {
    mockBlock.mockResolvedValue({ data: { status: 'blocked' } });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBlock(), { wrapper });

    await act(async () => {
      await result.current.block({ blockedUserId: 'u1' });
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'User blocked',
      expect.any(String),
    );
  });

  it('calls onSuccess callback after blocking', async () => {
    mockBlock.mockResolvedValue({ data: { status: 'blocked' } });
    const onSuccess = jest.fn();

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBlock({ onSuccess }), { wrapper });

    await act(async () => {
      await result.current.block({ blockedUserId: 'u1' });
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows error alert on failed block', async () => {
    mockBlock.mockRejectedValue(new Error('Server error'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBlock(), { wrapper });

    await act(async () => {
      try {
        await result.current.block({ blockedUserId: 'u1' });
      } catch {
        // expected
      }
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Could not block user',
      expect.any(String),
    );
  });

  it('passes matchId when provided', async () => {
    mockBlock.mockResolvedValue({ data: { status: 'blocked' } });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBlock(), { wrapper });

    await act(async () => {
      await result.current.block({ blockedUserId: 'u1', matchId: 'm1' });
    });

    expect(mockBlock).toHaveBeenCalledWith({ blockedUserId: 'u1', matchId: 'm1' });
  });
});
