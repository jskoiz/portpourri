import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { Match, User } from '../../../api/types';
import AppBackButton from '../../../components/ui/AppBackButton';
import AppIcon from '../../../components/ui/AppIcon';
import { GlassView } from '../../../design/primitives/GlassView';
import type { Theme } from '../../../theme/tokens';
import { radii, spacing, typography } from '../../../theme/tokens';
import { chatStyles as styles } from './chat.styles';

export function ChatHeader({
  activityTag,
  onBack,
  onBlock,
  onOpenQuickActions,
  onReport,
  photoUrl,
  theme,
  user,
}: {
  activityTag: string;
  onBack: () => void;
  onBlock?: () => void;
  onOpenQuickActions: () => void;
  onReport?: () => void;
  photoUrl?: string;
  theme: Theme;
  user: Match['user'] | User;
}) {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <GlassView tier="medium" borderRadius={0} style={styles.header}>
      <AppBackButton onPress={onBack} style={styles.backBtn} />
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={[styles.headerAvatar, { borderColor: theme.primary }]} contentFit="cover" accessibilityLabel={`Photo of ${user?.firstName || 'match'}`} />
      ) : (
        <View
          style={[
            styles.headerAvatar,
            {
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.border,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '700' }}>
            {user?.firstName?.[0] || '?'}
          </Text>
        </View>
      )}
      <View style={styles.headerInfo}>
        <Text style={[styles.headerEyebrow, { color: theme.textMuted }]}>MATCH CONVERSATION</Text>
        <Text style={[styles.headerName, { color: theme.textPrimary }]}>{user?.firstName || 'Chat'}</Text>
        {activityTag ? (
          <View style={[styles.headerTag, { backgroundColor: theme.primarySubtle, borderColor: theme.primary }]}>
            <Text style={[styles.headerTagText, { color: theme.primary }]}>{activityTag}</Text>
          </View>
        ) : null}
      </View>
      <View style={headerMenuStyles.menuAnchor}>
        <Pressable
          onPress={() => setMenuVisible((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="More options"
          accessibilityHint="Opens conversation options"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <GlassView tier="thin" borderRadius={19} style={styles.quickActionTriggerGlass}>
            <AppIcon name="more-horizontal" size={16} color={theme.textPrimary} />
          </GlassView>
        </Pressable>
        {menuVisible && (
          <View style={[headerMenuStyles.menu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Pressable
              onPress={() => { setMenuVisible(false); onOpenQuickActions(); }}
              style={headerMenuStyles.menuItem}
              accessibilityRole="menuitem"
            >
              <AppIcon name="zap" size={16} color={theme.textPrimary} />
              <Text style={[headerMenuStyles.menuItemText, { color: theme.textPrimary }]}>Quick actions</Text>
            </Pressable>
            {onReport && (
              <Pressable
                onPress={() => { setMenuVisible(false); onReport(); }}
                style={headerMenuStyles.menuItem}
                accessibilityRole="menuitem"
              >
                <AppIcon name="flag" size={16} color={theme.textPrimary} />
                <Text style={[headerMenuStyles.menuItemText, { color: theme.textPrimary }]}>Report</Text>
              </Pressable>
            )}
            {onBlock && (
              <Pressable
                onPress={() => { setMenuVisible(false); onBlock(); }}
                style={headerMenuStyles.menuItem}
                accessibilityRole="menuitem"
              >
                <AppIcon name="slash" size={16} color={theme.danger} />
                <Text style={[headerMenuStyles.menuItemText, { color: theme.danger }]}>Block</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </GlassView>
  );
}

const headerMenuStyles = StyleSheet.create({
  menuAnchor: {
    position: 'relative',
    zIndex: 10,
  },
  menu: {
    position: 'absolute',
    top: 44,
    right: 0,
    borderRadius: radii.lg,
    paddingVertical: spacing.xs,
    minWidth: 170,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  menuItemText: {
    fontSize: typography.body,
    fontWeight: '600',
  },
});
