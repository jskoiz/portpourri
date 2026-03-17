import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { normalizeApiError } from '../api/errors';
import type { Match } from '../api/types';
import AppBackdrop from '../components/ui/AppBackdrop';
import { StatePanel } from '../design/primitives';
import { radii, spacing, typography } from '../theme/tokens';
import { fontFamily } from '../lib/fonts';
import { useMatches } from '../features/matches/hooks/useMatches';
import type { MainTabScreenProps } from '../core/navigation/types';
import { getAvatarInitial, getPrimaryPhotoUri } from '../lib/profilePhotos';
import { getActivityTag } from '../lib/profile-helpers';

// ─── Design Tokens (reactive via useTheme() in components) ───────────────────
import { useTheme } from '../theme/useTheme';
import { lightTheme } from '../theme/tokens';

// Static references for StyleSheet (module-level); components use useTheme() for reactivity
const BASE = lightTheme.background;
const SURFACE = lightTheme.surface;
const PRIMARY = lightTheme.primary;
const ACCENT = lightTheme.accent;
const TEXT_PRIMARY = lightTheme.textPrimary;

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

// Assign a consistent accent color per user based on name
function getUserAccent(name?: string): string {
  const ACCENTS = ['#C4A882', '#D4A59A', '#B8A9C4', '#8BAA7A', '#D4C9DB', '#C4A882'];
  const idx = (name?.charCodeAt(0) ?? 65) % ACCENTS.length;
  return ACCENTS[idx];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_PADDING = spacing.xxl;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

// ─── Match Card (photo-forward grid) ─────────────────────────────────────────
function MatchCard({ item, onPress }: { item: Match; onPress: () => void }) {
  const accent = getUserAccent(item.user.firstName);
  const photoUrl = getPrimaryPhotoUri(item.user);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${item.user.firstName || 'Match'}. ${item.lastMessage || 'No messages yet'}`}
      accessibilityHint="Tap to open conversation"
    >
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={styles.cardImage}
          contentFit="cover"
          accessibilityLabel={`Photo of ${item.user.firstName || 'match'}`}
        />
      ) : (
        <View style={[styles.cardImage, styles.cardImageFallback, { backgroundColor: accent + '22' }]}>
          <Text style={[styles.cardFallbackInitial, { color: accent }]}>
            {getAvatarInitial(item.user.firstName)}
          </Text>
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)']}
        style={styles.cardGradient}
      />
      <View style={styles.cardOverlay}>
        <Text style={styles.cardName} numberOfLines={1}>{item.user.firstName || 'Match'}</Text>
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MatchesScreen() {
  const theme = useTheme();
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
        <Text style={styles.eyebrow}>MATCHES</Text>
        <Text style={styles.title}>Matches</Text>
        {matches.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{matches.length} active</Text>
          </View>
        )}
      </View>

      {loading ? (
        <StatePanel title="Loading conversations" loading />
      ) : errorMessage ? (
        <StatePanel
          title="Couldn't load inbox"
          description={errorMessage}
          actionLabel="Try again"
          onAction={() => {
            void refetch();
          }}
          isError
        />
      ) : matches.length === 0 ? (
        <StatePanel
          title="Nothing here yet"
          description="Start discovering people to find your first match."
          actionLabel="Go explore"
          onAction={() => navigation.navigate('Discover')}
        />
      ) : (
        <FlashList
          data={matches}
          numColumns={2}
          overrideProps={{ estimatedItemSize: 200 }}
          renderItem={({ item, index }) =>
            <View style={{ marginRight: index % 2 === 0 ? GRID_GAP : 0, marginBottom: GRID_GAP }}>
              <MatchCard
                item={item}
                onPress={() => navigation.navigate('Chat', { matchId: item.id, user: item.user })}
              />
            </View>
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
    opacity: 0.04,
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
    fontSize: 32,
    fontFamily: fontFamily.serifBold,
    letterSpacing: -0.5,
    color: TEXT_PRIMARY,
    lineHeight: 36,
    marginBottom: spacing.md,
  },
  countBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(196,168,130,0.15)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(196,168,130,0.35)',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: PRIMARY,
  },
  list: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 80,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: SURFACE,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    borderRadius: 18,
  } as any,
  cardImageFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFallbackInitial: {
    fontSize: 36,
    fontWeight: '900',
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
  },
  cardName: {
    fontSize: typography.body,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
