import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { normalizeApiError } from '../api/errors';
import type { Match } from '../api/types';
import AppState from '../components/ui/AppState';
import AppBackdrop from '../components/ui/AppBackdrop';
import { radii, spacing, typography } from '../theme/tokens';
import { useMatches } from '../features/matches/hooks/useMatches';
import type { MainTabScreenProps } from '../core/navigation/types';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const BASE = '#0D1117';
const SURFACE = '#161B22';
const BORDER = 'rgba(255,255,255,0.07)';
const PRIMARY = '#7C6AF7';
const ACCENT = '#34D399';
const TEXT_PRIMARY = '#F0F6FC';
const TEXT_SECONDARY = 'rgba(240,246,252,0.6)';
const TEXT_MUTED = 'rgba(240,246,252,0.38)';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(timestamp?: string) {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function getActivityTag(user: any): string {
  const goal = user?.fitnessProfile?.primaryGoal;
  if (!goal) return '';
  const map: Record<string, string> = {
    strength: 'Strength',
    weight_loss: 'Conditioning',
    endurance: 'Endurance',
    mobility: 'Mobility',
    connection: 'Connection',
    performance: 'Performance',
    both: 'Open',
  };
  return map[goal] || goal;
}

// Assign a consistent accent color per user based on name
function getUserAccent(name?: string): string {
  const ACCENTS = [PRIMARY, ACCENT, '#F59E0B', '#F87171', '#60A5FA', '#FB923C'];
  const idx = (name?.charCodeAt(0) ?? 65) % ACCENTS.length;
  return ACCENTS[idx];
}

// ─── Match Row ────────────────────────────────────────────────────────────────
function MatchRow({ item, onPress }: { item: Match; onPress: () => void }) {
  const hasUnread = !!item.lastMessage;
  const activityTag = getActivityTag(item.user);
  const accent = getUserAccent(item.user.firstName);

  return (
    <Pressable
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.85 : 1 }]}
      onPress={onPress}
    >
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        {item.user.photoUrl ? (
          <Image
            source={{ uri: item.user.photoUrl }}
            style={[styles.avatar, { borderColor: hasUnread ? accent : BORDER }]}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarFallback,
              { backgroundColor: accent + '22', borderColor: hasUnread ? accent : BORDER },
            ]}
          >
            <Text style={[styles.avatarInitial, { color: accent }]}>
              {item.user.firstName?.[0] || '?'}
            </Text>
          </View>
        )}
        {hasUnread && (
          <View style={[styles.avatarUnreadDot, { backgroundColor: accent, borderColor: BASE }]} />
        )}
      </View>

      {/* Text content */}
      <View style={styles.rowContent}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.user.firstName || 'Match'}</Text>
          <Text style={styles.timestamp}>{timeAgo(item.createdAt as string)}</Text>
        </View>
        <Text style={styles.lastMsg} numberOfLines={1}>
          {item.lastMessage || 'Start the conversation'}
        </Text>
      </View>

      {/* Activity tag */}
      {activityTag ? (
        <View style={[styles.activityTag, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
          <Text style={[styles.activityTagText, { color: accent }]}>{activityTag}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MatchesScreen() {
  const navigation = useNavigation<MainTabScreenProps<'Inbox'>['navigation']>();
  const { error, isLoading: loading, isRefetching, matches, refetch } =
    useMatches();
  const errorMessage = error ? normalizeApiError(error).message : null;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppBackdrop />
      <View style={styles.ambientGlow} pointerEvents="none" />

      <View style={styles.header}>
        <Text style={styles.eyebrow}>MATCHES / INNER CIRCLE</Text>
        <Text style={styles.title}>Your{'\n'}circle.</Text>
        {matches.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{matches.length} active</Text>
          </View>
        )}
      </View>

      {loading ? (
        <AppState title="Loading conversations" loading />
      ) : errorMessage ? (
        <AppState
          title="Couldn't load inbox"
          description={errorMessage}
          actionLabel="Try again"
          onAction={() => {
            void refetch();
          }}
          isError
        />
      ) : matches.length === 0 ? (
        <AppState
          title="Nothing here yet"
          description="Keep discovering — your next connection is just a swipe away."
          actionLabel="Go explore"
          onAction={() => navigation.navigate('Discover')}
        />
      ) : (
        <FlashList
          data={matches}
          renderItem={({ item }) =>
            <MatchRow
              item={item}
              onPress={() => navigation.navigate('Chat', { matchId: item.id, user: item.user })}
            />
          }
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !loading}
              onRefresh={() => {
                void refetch();
              }}
              tintColor={PRIMARY}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BASE,
  },
  ambientGlow: {
    position: 'absolute',
    top: -40,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: PRIMARY,
    opacity: 0.07,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3.5,
    color: ACCENT,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.5,
    color: TEXT_PRIMARY,
    lineHeight: 48,
    marginBottom: spacing.md,
  },
  countBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124,106,247,0.15)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(124,106,247,0.35)',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: PRIMARY,
  },
  list: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: 80,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    padding: spacing.md,
    marginBottom: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    gap: spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: typography.h3,
    fontWeight: '900',
  },
  avatarUnreadDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
  },
  rowContent: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  name: {
    fontSize: typography.body,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    letterSpacing: -0.2,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  lastMsg: {
    fontSize: typography.bodySmall,
    lineHeight: 20,
    color: TEXT_SECONDARY,
  },
  activityTag: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    flexShrink: 0,
  },
  activityTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
