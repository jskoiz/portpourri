import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import AppBackButton from '../../../components/ui/AppBackButton';
import { chatStyles as styles } from './chat.styles';

export function ChatHeader({
  activityTag,
  onBack,
  photoUrl,
  theme,
  user,
}: {
  activityTag: string;
  onBack: () => void;
  photoUrl?: string;
  theme: any;
  user: any;
}) {
  return (
    <View style={[styles.header, { backgroundColor: theme.surfaceGlass, borderBottomColor: theme.border }]}>
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
    </View>
  );
}

