import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { normalizeApiError } from '../api/errors';
import type { AppNotification } from '../api/types';
import AppBackButton from '../components/ui/AppBackButton';
import AppBackdrop from '../components/ui/AppBackdrop';
import AppIcon from '../components/ui/AppIcon';
import { StatePanel } from '../design/primitives';
import { useTheme } from '../theme/useTheme';
import type { Theme } from '../theme/tokens';
import { radii, spacing, typography } from '../theme/tokens';
import { useNotifications } from '../features/notifications/hooks/useNotifications';
import type { RootStackScreenProps } from '../core/navigation/types';

function getNotificationMeta(type: AppNotification['type']) {
  switch (type) {
    case 'match_created':
    case 'like_received':
      return { icon: 'heart' as const, color: '#C4A882' };
    case 'message_received':
      return { icon: 'message-square' as const, color: '#8BAA7A' };
    case 'event_rsvp':
      return { icon: 'users' as const, color: '#C4A882' };
    case 'event_reminder':
      return { icon: 'calendar' as const, color: '#8BAA7A' };
    default:
      return { icon: 'bell' as const, color: '#B8A9C4' };
  }
}

function getNotificationGroup(dateValue: string | Date) {
  const createdAt = new Date(dateValue);
  const now = new Date();
  const isToday =
    createdAt.getFullYear() === now.getFullYear() &&
    createdAt.getMonth() === now.getMonth() &&
    createdAt.getDate() === now.getDate();

  return isToday ? 'Today' : 'Earlier';
}

// ─── NotifRow ─────────────────────────────────────────────────────────────────

function NotifRow({
  notif,
  theme,
  onMarkRead,
}: {
  notif: AppNotification;
  theme: Theme;
  onMarkRead: (id: string) => void;
}) {
  const { color, icon } = getNotificationMeta(notif.type);
  const isRead = Boolean(notif.readAt);

  return (
    <TouchableOpacity
      style={[
        styles.notifRow,
        {
          backgroundColor: isRead ? theme.surfaceElevated : theme.surface,
          borderColor: isRead ? theme.border : color + '44',
          borderLeftColor: color,
        },
      ]}
      onPress={() => {
        if (!isRead) onMarkRead(notif.id);
      }}
      activeOpacity={0.85}
    >
      {/* Icon */}
      <View style={[styles.notifIconWrap, { backgroundColor: color + '20' }]}>
        <AppIcon name={icon} size={18} color={color} />
      </View>

      {/* Content */}
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, { color: theme.textPrimary }]}>{notif.title}</Text>
        <Text style={[styles.notifBody, { color: theme.textSecondary }]}>{notif.body}</Text>
      </View>

      {!isRead ? (
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={() => onMarkRead(notif.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.6}
        >
          <AppIcon name="check" size={16} color={color} />
        </TouchableOpacity>
      ) : null}

      {/* Unread dot */}
      {!isRead && (
        <View style={[styles.unreadDot, { backgroundColor: color }]} />
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<RootStackScreenProps<'Notifications'>['navigation']>();
  const [actionError, setActionError] = useState<string | null>(null);
  const {
    error,
    isLoading: loading,
    isRefetching,
    markAllRead,
    markRead,
    notifications: notifs,
    refetch,
    unreadCount,
  } = useNotifications();
  const errorMessage =
    actionError ?? (error ? normalizeApiError(error).message : null);

  useFocusEffect(
    useCallback(() => {
      setActionError(null);
      void refetch();
    }, [refetch]),
  );

  const handleMarkRead = async (id: string) => {
    try {
      setActionError(null);
      await markRead(id);
    } catch (err) {
      setActionError(normalizeApiError(err).message);
    }
  };

  const clearAll = async () => {
    try {
      setActionError(null);
      await markAllRead();
    } catch (err) {
      setActionError(normalizeApiError(err).message);
    }
  };

  const todayNotifs = notifs.filter(
    (n) => getNotificationGroup(n.createdAt) === 'Today',
  );
  const earlierNotifs = notifs.filter(
    (n) => getNotificationGroup(n.createdAt) === 'Earlier',
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <AppBackdrop />

      {/* Header */}
      <View style={styles.header}>
        <AppBackButton onPress={() => navigation.goBack()} />
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: theme.accent }]}>INBOX</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Notifications</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={clearAll} activeOpacity={0.7}>
            <Text style={[styles.clearAll, { color: theme.textMuted }]}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <StatePanel title="Loading notifications" loading />
      ) : errorMessage && notifs.length === 0 ? (
        <StatePanel
          title="Couldn't load notifications"
          description={errorMessage}
          actionLabel="Try again"
          onAction={() => {
            void refetch();
          }}
          isError
        />
      ) : notifs.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconWrap, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <AppIcon name="bell" size={24} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>All caught up!</Text>
          <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
            Notifications will appear here when you get matches, messages, and activity invites.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !loading}
              onRefresh={() => {
                void refetch();
              }}
              tintColor={theme.primary}
            />
          }
        >
          {todayNotifs.length > 0 && (
            <View style={styles.group}>
              <Text style={[styles.groupLabel, { color: theme.textMuted }]}>Today</Text>
              {todayNotifs.map((n) => (
                <NotifRow
                  key={n.id}
                  notif={n}
                  theme={theme}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </View>
          )}
          {earlierNotifs.length > 0 && (
            <View style={styles.group}>
              <Text style={[styles.groupLabel, { color: theme.textMuted }]}>Earlier</Text>
              {earlierNotifs.map((n) => (
                <NotifRow
                  key={n.id}
                  notif={n}
                  theme={theme}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 2.2,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.h2,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  clearAll: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
  },

  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: 64,
  },

  group: {
    marginBottom: spacing.lg,
  },
  groupLabel: {
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },

  // Notification row
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    position: 'relative',
  },
  notifIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
    marginBottom: 3,
  },
  notifBody: {
    fontSize: typography.caption,
    lineHeight: 18,
  },
  dismissBtn: {
    padding: 4,
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl || 40,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.h3,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyBody: {
    fontSize: typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
});
