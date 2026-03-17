import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import {
  AppBottomSheet,
  APP_BOTTOM_SHEET_SNAP_POINTS,
  type AppBottomSheetProps,
} from '../../../design/sheets/AppBottomSheet';
import { useTheme } from '../../../theme/useTheme';
import { lightTheme, radii, spacing, typography } from '../../../theme/tokens';
import { matchesApi } from '../../../services/api';
import { queryKeys } from '../../../lib/query/queryKeys';
import { getPrimaryPhotoUri } from '../../../lib/profilePhotos';
import type { Match } from '../../../api/types';

export function MatchPickerSheet({
  controller,
  onClose,
  onSelectMatch,
}: {
  controller: Pick<
    AppBottomSheetProps,
    'onChangeIndex' | 'onDismiss' | 'onRequestClose' | 'refObject' | 'visible'
  >;
  onClose: () => void;
  onSelectMatch: (match: Match) => void;
}) {
  const theme = useTheme();
  const { data: matches, isLoading } = useQuery({
    queryKey: queryKeys.matches.list,
    queryFn: async () => (await matchesApi.list()).data || [],
    enabled: controller.visible,
  });

  return (
    <AppBottomSheet
      {...controller}
      title="Share with a match"
      subtitle="Pick someone to invite to this event."
      snapPoints={APP_BOTTOM_SHEET_SNAP_POINTS.standard}
    >
      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={styles.loader} />
      ) : !matches?.length ? (
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          No matches yet. Start swiping to find your workout partner!
        </Text>
      ) : (
        matches.map((match) => (
          <Pressable
            key={match.id}
            onPress={() => {
              onClose();
              onSelectMatch(match);
            }}
            style={({ pressed }) => [
              styles.matchRow,
              {
                backgroundColor: pressed ? theme.surfaceElevated : 'transparent',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Invite ${match.user.firstName}`}
          >
            {match.user.photoUrl ? (
              <Image
                source={{ uri: match.user.photoUrl }}
                style={[styles.avatar, { borderColor: theme.border }]}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>
                  {match.user.firstName?.[0] ?? '?'}
                </Text>
              </View>
            )}
            <Text style={[styles.matchName, { color: theme.textPrimary }]}>
              {match.user.firstName}
            </Text>
          </Pressable>
        ))
      )}
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginVertical: spacing.xl,
  },
  emptyText: {
    fontSize: typography.body,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
  },
  matchName: {
    fontSize: typography.body,
    fontWeight: '600',
  },
});
