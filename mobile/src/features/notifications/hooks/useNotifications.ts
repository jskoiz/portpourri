import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../../services/api';
import type { AppNotification } from '../../../api/types';
import { queryKeys } from '../../../lib/query/queryKeys';

const EMPTY_NOTIFICATIONS: AppNotification[] = [];

function getNotificationList() {
  return queryKeys.notifications.list();
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: getNotificationList(),
    queryFn: async () =>
      (await notificationsApi.list() as { data: AppNotification[] | null }).data || [],
    staleTime: 60_000,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) =>
      (await notificationsApi.markRead(id) as { data: AppNotification }).data,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: getNotificationList() });
      const previous =
        queryClient.getQueryData<AppNotification[]>(getNotificationList()) || EMPTY_NOTIFICATIONS;

      queryClient.setQueryData<AppNotification[]>(
        getNotificationList(),
        previous.map((item) =>
          item.id === id && !item.readAt
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(getNotificationList(), context.previous);
      }
    },
    onSuccess: (updated, id) => {
      if (!updated) {
        return;
      }

      queryClient.setQueryData<AppNotification[]>(
        getNotificationList(),
        (current = []) =>
          current.map((item) => (item.id === id ? updated : item)),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: getNotificationList() });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => notificationsApi.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: getNotificationList() });
      const previous =
        queryClient.getQueryData<AppNotification[]>(getNotificationList()) || EMPTY_NOTIFICATIONS;
      const now = new Date().toISOString();

      queryClient.setQueryData<AppNotification[]>(
        getNotificationList(),
        previous.map((item) => ({
          ...item,
          readAt: item.readAt ?? now,
        })),
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(getNotificationList(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: getNotificationList() });
    },
  });

  const notifications = query.data ?? EMPTY_NOTIFICATIONS;
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications],
  );

  return {
    ...query,
    notifications,
    unreadCount,
    markRead: markRead.mutateAsync,
    markAllRead: markAllRead.mutateAsync,
    isMarkingRead: markRead.isPending,
    isMarkingAllRead: markAllRead.isPending,
  };
}
