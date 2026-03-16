import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useExploreEvents } from '../useExploreEvents';

const mockList = jest.fn();

jest.mock('../../../../services/api', () => ({
  eventsApi: {
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

describe('useExploreEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns events on success', async () => {
    const events = [{ id: 'e1', title: 'Yoga' }];
    mockList.mockResolvedValue({ data: events });

    const { result } = renderHook(() => useExploreEvents(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.events).toEqual(events);
  });

  it('returns empty array on API failure', async () => {
    mockList.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useExploreEvents(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.events).toEqual([]);
  });

  it('starts in loading state', () => {
    mockList.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useExploreEvents(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.events).toEqual([]);
  });
});
