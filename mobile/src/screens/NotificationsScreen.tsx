import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
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
import {
  buildNotificationSections,
  getNotificationBodyFallback,
  getNotificationMeta,
  getNotificationTitleFallback,
} from '../features/notifications/notificationPresentation';
import { resolveNotificationNavigation } from '../features/notifications/notificationNavigation';
import type { RootStackScreenProps } from '../core/navigation/types';

const NOTIFICATION_REFRESH_INTERVAL_MS = 60_000;

// ─── NotifRow ─────────────────────────────────────────────────────────────────

const NotifRow = memo(function NotifRow({
  notif,
  theme,
  onMarkRead,
  onNavigate,
}: {
  notif: AppNotification;
  theme: Theme;
  onMarkRead: (id: string) => void;
  onNavigate: (notif: AppNotification) => void;
}) {
  const { color, icon } = getNotificationMeta(notif.type);
  const isRead = Boolean(notif.readAt);
  const title = notif.title?.trim() || getNotificationTitleFallback(notif.type);
  const body = notif.body?.trim() || getNotificationBodyFallback(notif.type);

  return (
    <TouchableOpacity
      style={[
        styles.notifRow,
        {
          backgroundColor: isRead ? theme.surfaceElevated : theme.surface,
          borderColor: isRead ? theme.border : color + '44',
          borderLeftColor: color,
          minHeight: 56,
        },
      ]}
      onPress={() => {
        if (!isRead) onMarkRead(notif.id);
        onNavigate(notif);
      }}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
      accessibilityHint={isRead ? 'Already read' : 'Tap to mark as read'}
    >
      {/* Icon */}
      <View style={[styles.notifIconWrap, { backgroundColor: color + '20' }]}>
        <AppIcon name={icon} size={18} color={color} />
      </View>

      {/* Content */}
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.notifBody, { color: theme.textSecondary }]}>{body}</Text>
      </View>

      {!isRead ? (
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={(event) => {
            event?.stopPropagation?.();
            onMarkRead(notif.id);
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel="Mark as read"
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
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen({
  navigation,
}: RootStackScreenProps<'Notifications'>) {
  const theme = useTheme();
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
  const lastFocusedAt = useRef(0);

  useFocusEffect(
    useCallback(() => {
      setActionError(null);
      const now = Date.now();
      if (now - lastFocusedAt.current >= NOTIFICATION_REFRESH_INTERVAL_MS) {
        lastFocusedAt.current = now;
        void refetch();
      }
    }, [refetch]),
  );

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      setActionError(null);
      await markRead(id);
    } catch (err) {
      setActionError(normalizeApiError(err).message);
    }
  }, [markRead]);

  const clearAll = useCallback(async () => {
    try {
      setActionError(null);
      await markAllRead();
    } catch (err) {
      setActionError(normalizeApiError(err).message);
    }
  }, [markAllRead]);

  const handleRetry = useCallback(() => {
    setActionError(null);
    void refetch();
  }, [refetch]);

  const handleNavigate = useCallback((notif: AppNotification) => {
    setActionError(null);
    const result = resolveNotificationNavigation(notif);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    if (result.target.route === 'Chat') {
      navigation.navigate('Chat', result.target.params);
      return;
    }

    if (result.target.route === 'EventDetail') {
      navigation.navigate('EventDetail', result.target.params);
      return;
    }

    navigation.navigate('ProfileDetail', result.target.params);
  }, [navigation]);
  const sections = useMemo(() => buildNotificationSections(notifs), [notifs]);
  const renderNotification = useCallback(
    ({ item }: { item: AppNotification }) => (
      <NotifRow
        notif={item}
        theme={theme}
        onMarkRead={handleMarkRead}
        onNavigate={handleNavigate}
      />
    ),
    [handleMarkRead, handleNavigate, theme],
  );
  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: { title: string } }) => (
      <Text style={[styles.groupLabel, { color: theme.textMuted }]}>{title}</Text>
    ),
    [theme.textMuted],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <AppBackdrop />

      {/* Header */}
      <View style={styles.header}>
        <AppBackButton onPress={() => navigation.goBack()} />
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: theme.accent }]}>NOTIFICATIONS</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]} accessibilityRole="header">Notifications</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={clearAll}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Mark all notifications as read"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
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
          onAction={handleRetry}
          isError
        />
      ) : notifs.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconWrap, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <AppIcon name="bell" size={24} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No notifications</Text>
          <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
            You'll see matches, messages, and event updates here.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={
            actionError ? (
              <View style={styles.routeError}>
                <Text style={[styles.routeErrorText, { color: theme.danger }]}>
                  {actionError}
                </Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !loading}
              onRefresh={handleRetry}
              tintColor={theme.primary}
            />
          }
        />
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
  routeError: {
    backgroundColor: 'rgba(196, 168, 130, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(196, 168, 130, 0.32)',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  routeErrorText: {
    fontSize: typography.caption,
    lineHeight: 18,
  },

  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: 64,
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
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
