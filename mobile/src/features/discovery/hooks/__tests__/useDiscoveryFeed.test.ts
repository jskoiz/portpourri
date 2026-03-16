import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

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

    const { result } = renderHook(() => useDiscoveryFeed(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.feed).toEqual(users);
  });

  it('returns empty feed on API error', async () => {
    mockFeed.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDiscoveryFeed(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.feed).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });

  it('starts in loading state', () => {
    mockFeed.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useDiscoveryFeed(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.feed).toEqual([]);
  });

  it('passes filters to the API', async () => {
    mockFeed.mockResolvedValue({ data: [] });
    const filters = { distanceKm: 10, goals: ['strength'] };

    const { result } = renderHook(() => useDiscoveryFeed(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFeed).toHaveBeenCalledWith(filters);
  });
});
