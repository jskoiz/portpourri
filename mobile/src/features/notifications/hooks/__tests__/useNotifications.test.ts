import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useNotifications } from '../useNotifications';

const mockList = jest.fn();
const mockMarkRead = jest.fn();
const mockMarkAllRead = jest.fn();

jest.mock('../../../../services/api', () => ({
  notificationsApi: {
    list: (...args: unknown[]) => mockList(...args),
    markRead: (...args: unknown[]) => mockMarkRead(...args),
    markAllRead: (...args: unknown[]) => mockMarkAllRead(...args),
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

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns notifications and unread count on success', async () => {
    const notifications = [
      { id: 'n1', title: 'Match!', readAt: null },
      { id: 'n2', title: 'Like', readAt: '2026-01-01T00:00:00Z' },
    ];
    mockList.mockResolvedValue({ data: notifications });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.notifications).toEqual(notifications);
    expect(result.current.unreadCount).toBe(1);
  });

  it('returns empty notifications on API failure', async () => {
    mockList.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('starts in loading state', () => {
    mockList.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.notifications).toEqual([]);
  });
});
