import { useQuery } from '@tanstack/react-query';
import type { AppNotification } from '../../../api/types';
import { notificationsApi } from '../../../services/api';
import { queryKeys } from '../../../lib/query/queryKeys';

export function useUnreadNotificationCount() {
  const query = useQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: async () => (await notificationsApi.list()).data || [],
    select: (notifications: AppNotification[]) =>
      notifications.filter((item) => !item.readAt).length,
  });

  return { unreadCount: query.data ?? 0 };
}
