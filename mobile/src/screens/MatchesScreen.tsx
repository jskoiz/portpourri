import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { normalizeApiError } from '../api/errors';
import type { Match } from '../api/types';
import AppBackdrop from '../components/ui/AppBackdrop';
import { ChatListSkeleton } from '../components/skeletons';
import { StatePanel } from '../design/primitives';
import { radii, spacing, typography } from '../theme/tokens';
import { fontFamily } from '../lib/fonts';
import { useMatches } from '../features/matches/hooks/useMatches';
import type { MainTabScreenProps } from '../core/navigation/types';
import { getAvatarInitial, getPrimaryPhotoUri } from '../lib/profilePhotos';
import { useTheme } from '../theme/useTheme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Curated accent palette — spread across distinct hues so nearby names don't collide
const ACCENT_PALETTE = ['#C4A882', '#D4A59A', '#B8A9C4', '#8BAA7A', '#D4C9DB', '#A8C4B8'];

/** Assign a consistent accent color per user using a simple hash over the full name. */
function getUserAccent(name?: string): string {
  if (!name) return ACCENT_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return ACCENT_PALETTE[Math.abs(hash) % ACCENT_PALETTE.length];
}

const GRID_GAP = 12;
const GRID_PADDING = spacing.xxl;

// ─── Match Card (photo-forward grid) ─────────────────────────────────────────
const MatchCard = React.memo(function MatchCard({
  item,
  onPress,
  cardWidth,
}: {
  item: Match;
  onPress: () => void;
  cardWidth: number;
}) {
  const theme = useTheme();
  const accent = getUserAccent(item.user.firstName);
  const photoUrl = getPrimaryPhotoUri(item.user);

  const cardStyle = useMemo(
    () => ({
      width: cardWidth,
      height: cardWidth * 1.3,
      borderRadius: 18,
      overflow: 'hidden' as const,
      backgroundColor: theme.surface,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    }),
    [cardWidth, theme.surface],
  );

  return (
    <Pressable
      style={({ pressed }) => [cardStyle, { opacity: pressed ? 0.9 : 1 }]}
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
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MatchesScreen({ navigation }: MainTabScreenProps<'Inbox'>) {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - GRID_PADDING * 2 - GRID_GAP) / 2;

  const { error, isLoading: loading, isRefetching, matches, refetch } =
    useMatches();
  const errorMessage = error ? normalizeApiError(error).message : null;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const dynamicStyles = useMemo(
    () => ({
      container: { flex: 1, backgroundColor: theme.background } as const,
      ambientGlow: {
        position: 'absolute' as const,
        top: -40,
        left: -60,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: theme.primary,
        opacity: 0.04,
      },
      title: {
        fontSize: 32,
        fontFamily: fontFamily.serifBold,
        letterSpacing: -0.5,
        color: theme.textPrimary,
        lineHeight: 36,
        marginBottom: spacing.md,
      },
      countBadgeText: {
        fontSize: 12,
        fontWeight: '800' as const,
        color: theme.primary,
      },
    }),
    [theme],
  );

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <AppBackdrop />
      <View style={dynamicStyles.ambientGlow} pointerEvents="none" />

      <View style={styles.header}>
        <Text style={dynamicStyles.title} accessibilityRole="header">Matches</Text>
        {matches.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={dynamicStyles.countBadgeText}>{matches.length} active</Text>
          </View>
        )}
      </View>

      {loading ? (
        <ChatListSkeleton testID="chat-list-skeleton" />
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
          renderItem={({ item, index }) =>
            <View style={{ marginRight: index % 2 === 0 ? GRID_GAP : 0, marginBottom: GRID_GAP }}>
              <MatchCard
                item={item}
                onPress={() => navigation.navigate('Chat', { matchId: item.id, user: item.user })}
                cardWidth={cardWidth}
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
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
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
  list: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 80,
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
