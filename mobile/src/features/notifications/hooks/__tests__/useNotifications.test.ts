import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useNotifications } from '../useNotifications';
import { queryKeys } from '../../../../lib/query/queryKeys';

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

function createTestHarness() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return { queryClient, wrapper };
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
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

    const { wrapper } = createTestHarness();
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.notifications).toEqual(notifications);
    expect(result.current.unreadCount).toBe(1);
  });

  it('returns empty notifications on API failure', async () => {
    mockList.mockRejectedValue(new Error('Network error'));

    const { wrapper } = createTestHarness();
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('starts in loading state', () => {
    mockList.mockReturnValue(new Promise(() => {}));

    const { wrapper } = createTestHarness();
    const { result } = renderHook(() => useNotifications(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.notifications).toEqual([]);
  });

  it('optimistically marks a notification as read and invalidates after success', async () => {
    const notifications = [
      { id: 'n1', title: 'Match!', readAt: null },
      { id: 'n2', title: 'Like', readAt: null },
    ];
    const updatedNotification = {
      id: 'n1',
      title: 'Match!',
      readAt: '2026-01-01T00:00:00Z',
    };
    const { queryClient, wrapper } = createTestHarness();
    const invalidateSpy = jest
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(undefined as never);
    mockList
      .mockResolvedValueOnce({ data: notifications })
      .mockResolvedValueOnce({ data: [updatedNotification, notifications[1]] });
    mockMarkRead.mockResolvedValue({ data: updatedNotification });

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.markRead('n1');
    });

    await waitFor(() => expect(result.current.notifications[0]?.readAt).toBe(updatedNotification.readAt));
    expect(result.current.unreadCount).toBe(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.notifications.list,
    });
  });

  it('surfaces markRead failures after the optimistic update', async () => {
    const notifications = [
      { id: 'n1', title: 'Match!', readAt: null },
      { id: 'n2', title: 'Like', readAt: '2026-01-01T00:00:00Z' },
    ];
    const { queryClient, wrapper } = createTestHarness();
    const invalidateSpy = jest
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(undefined as never);
    mockList.mockResolvedValue({ data: notifications });
    const mutation = deferred<{ data: { id: string; title: string; readAt: string } }>();
    mockMarkRead.mockReturnValue(mutation.promise);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const markReadPromise = result.current.markRead('n1');

    await waitFor(() => expect(result.current.notifications[0]?.readAt).toEqual(expect.any(String)));

    await act(async () => {
      mutation.reject(new Error('Network error'));
      await expect(markReadPromise!).rejects.toThrow('Network error');
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.notifications.list,
    });
  });

  it('optimistically marks all notifications read and invalidates after settle', async () => {
    const notifications = [
      { id: 'n1', title: 'Match!', readAt: null },
      { id: 'n2', title: 'Like', readAt: null },
    ];
    const { queryClient, wrapper } = createTestHarness();
    const invalidateSpy = jest
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(undefined as never);
    mockList
      .mockResolvedValueOnce({ data: notifications })
      .mockResolvedValueOnce({
        data: notifications.map((notification) => ({
          ...notification,
          readAt: notification.readAt ?? '2026-01-01T00:00:00Z',
        })),
      });
    mockMarkAllRead.mockResolvedValue({ data: { updated: 2 } });

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.markAllRead();
    });

    await waitFor(() => expect(result.current.unreadCount).toBe(0));
    expect(result.current.notifications.every((item) => Boolean(item.readAt))).toBe(true);

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.notifications.list,
    });
  });

  it('surfaces markAllRead failures after the optimistic update', async () => {
    const notifications = [
      { id: 'n1', title: 'Match!', readAt: null },
      { id: 'n2', title: 'Like', readAt: null },
    ];
    const { queryClient, wrapper } = createTestHarness();
    const invalidateSpy = jest
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(undefined as never);
    mockList.mockResolvedValue({ data: notifications });
    const mutation = deferred<{ data: { updated: number } }>();
    mockMarkAllRead.mockReturnValue(mutation.promise);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const markAllReadPromise = result.current.markAllRead();

    await waitFor(() => expect(result.current.unreadCount).toBe(0));

    await act(async () => {
      mutation.reject(new Error('Network error'));
      await expect(markAllReadPromise!).rejects.toThrow('Network error');
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.notifications.list,
    });
  });
});
