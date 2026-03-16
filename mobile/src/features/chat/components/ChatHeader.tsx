import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { Match, User } from '../../../api/types';
import AppBackButton from '../../../components/ui/AppBackButton';
import AppIcon from '../../../components/ui/AppIcon';
import { GlassView } from '../../../design/primitives/GlassView';
import type { Theme } from '../../../theme/tokens';
import { chatStyles as styles } from './chat.styles';

export function ChatHeader({
  activityTag,
  onBack,
  onOpenQuickActions,
  photoUrl,
  theme,
  user,
}: {
  activityTag: string;
  onBack: () => void;
  onOpenQuickActions: () => void;
  photoUrl?: string;
  theme: Theme;
  user: Match['user'] | User;
}) {
  return (
    <GlassView tier="medium" borderRadius={0} style={styles.header}>
      <AppBackButton onPress={onBack} style={styles.backBtn} />
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={[styles.headerAvatar, { borderColor: theme.primary }]} contentFit="cover" />
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
      <Pressable onPress={onOpenQuickActions}>
        <GlassView tier="thin" borderRadius={19} style={styles.quickActionTriggerGlass}>
          <AppIcon name="more-horizontal" size={16} color={theme.textPrimary} />
        </GlassView>
      </Pressable>
    </GlassView>
  );
}
