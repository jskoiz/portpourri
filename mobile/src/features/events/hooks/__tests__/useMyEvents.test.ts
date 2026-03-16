import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useMyEvents } from '../useMyEvents';

const mockMine = jest.fn();

jest.mock('../../../../services/api', () => ({
  eventsApi: {
    mine: (...args: unknown[]) => mockMine(...args),
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

describe('useMyEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns user events on success', async () => {
    const events = [{ id: 'e1', title: 'My Yoga' }];
    mockMine.mockResolvedValue({ data: events });

    const { result } = renderHook(() => useMyEvents(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.events).toEqual(events);
  });

  it('returns empty array on API failure', async () => {
    mockMine.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useMyEvents(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.events).toEqual([]);
  });

  it('starts in loading state', () => {
    mockMine.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useMyEvents(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.events).toEqual([]);
  });
});
