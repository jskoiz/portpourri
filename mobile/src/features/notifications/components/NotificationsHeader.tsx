import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppBackButton from '../../../components/ui/AppBackButton';
import { screenLayout } from '../../../design/primitives';
import { spacing, typography } from '../../../theme/tokens';
import type { Theme } from '../../../theme/tokens';

interface NotificationsHeaderProps {
  onClearAll: () => void;
  onGoBack: () => void;
  theme: Theme;
  unreadCount: number;
}

export function NotificationsHeader({
  onClearAll,
  onGoBack,
  theme,
  unreadCount,
}: NotificationsHeaderProps) {
  return (
    <View style={styles.header}>
      <AppBackButton onPress={onGoBack} />
      <View style={styles.copy}>
        <Text
          style={[styles.title, { color: theme.textPrimary }]}
          accessibilityRole="header"
        >
          Notifications
        </Text>
      </View>
      {unreadCount > 0 ? (
        <TouchableOpacity
          onPress={onClearAll}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Mark all notifications as read"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.clearAllButton}
        >
          <Text style={[styles.clearAllText, { color: theme.textMuted }]}>
            Clear all
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenLayout.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: typography.h2,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  clearAllButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  clearAllText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
  },
});
