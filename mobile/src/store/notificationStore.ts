import { create } from 'zustand';
import { notificationsApi } from '../services/api';

interface NotificationState {
  isSyncing: boolean;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  syncUnreadCount: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  isSyncing: false,
  unreadCount: 0,

  setUnreadCount: (count) => {
    set({ unreadCount: Math.max(0, count) });
  },

  syncUnreadCount: async () => {
    set({ isSyncing: true });
    try {
      const response = await notificationsApi.list();
      const unreadCount = (response.data || []).filter((item) => !item.readAt).length;
      set({ unreadCount });
    } catch {
      // Keep the last known badge count if the refresh fails.
    } finally {
      set({ isSyncing: false });
    }
  },
}));
