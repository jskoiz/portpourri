import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useMatches } from '../useMatches';

const mockList = jest.fn();

jest.mock('../../../../services/api', () => ({
  matchesApi: {
    list: (...args: unknown[]) => mockList(...args),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useMatches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns matches on success', async () => {
    const matches = [
      { id: 'm1', user: { id: 'u1', firstName: 'Alice' } },
    ];
    mockList.mockResolvedValue({ data: matches });

    const { result } = renderHook(() => useMatches(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.matches).toEqual(matches);
  });

  it('returns empty array on API failure', async () => {
    mockList.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useMatches(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.matches).toEqual([]);
  });

  it('starts in loading state', () => {
    mockList.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useMatches(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.matches).toEqual([]);
  });
});
