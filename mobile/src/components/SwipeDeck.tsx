import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Swiper from 'react-native-deck-swiper';
import { radii, shadows, spacing, typography } from '../theme/tokens';
import AppIcon from './ui/AppIcon';
import { getAvatarInitial, getPrimaryPhotoUri } from '../lib/profilePhotos';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_HEIGHT = Math.floor(SCREEN_HEIGHT * 0.68);

const DARK = {
  background: '#0D1117',
  surface: '#161B22',
  surfaceElevated: '#1C2330',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  accent: '#34D399',
  danger: '#F87171',
  primary: '#7C6AF7',
  textPrimary: '#F0F6FF',
  textSecondary: 'rgba(240,246,255,0.72)',
  textMuted: 'rgba(240,246,255,0.48)',
};

interface CardProps {
  user: any;
  onPress?: () => void;
}

const formatLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const profileChips = (user: any) => {
  const chips: string[] = [];

  const favoriteActivity = user.fitnessProfile?.favoriteActivities
    ?.split(',')
    .map((value: string) => value.trim())
    .find(Boolean);

  if (favoriteActivity) chips.push(formatLabel(favoriteActivity));
  if (user.fitnessProfile?.primaryGoal) chips.push(formatLabel(user.fitnessProfile.primaryGoal));
  if (user.fitnessProfile?.prefersMorning) chips.push('Mornings');
  else if (user.fitnessProfile?.prefersEvening) chips.push('Evenings');
  else if (user.fitnessProfile?.weeklyFrequencyBand) chips.push(`${user.fitnessProfile.weeklyFrequencyBand}x/week`);
  return chips.slice(0, 3);
};

const getIntentLabel = (intent?: string) => {
  if (intent === 'dating') return 'Dating';
  if (intent === 'workout') return 'Training';
  return 'Open to both';
};

const getPresenceLabel = (user: any) => {
  if (user?.profile?.city) return 'Available tonight';
  return 'Nearby now';
};

const getAlignmentLabel = (score?: number) => {
  if (typeof score !== 'number' || Number.isNaN(score)) return null;
  const normalizedScore = score <= 1 ? score * 100 : score;
  const percentage = Math.max(0, Math.min(100, Math.round(normalizedScore)));
  return `${percentage}% aligned`;
};

const getTempoLabel = (user: any) => {
  const frequency = user?.fitnessProfile?.weeklyFrequencyBand;
  const intensity = user?.fitnessProfile?.intensityLevel;

  if (frequency && intensity) return `${frequency}x week / ${intensity}`;
  if (frequency) return `${frequency}x week`;
  if (intensity) return intensity;
  return 'Intent-aware match';
};

const Card = ({ user, onPress }: CardProps) => {
  const primaryPhoto = getPrimaryPhotoUri(user);
  const chips = profileChips(user);
  const intentLabel = getIntentLabel(user.profile?.intent);
  const presenceLabel = getPresenceLabel(user);
  const alignmentLabel = getAlignmentLabel(user.recommendationScore);
  const tempoLabel = getTempoLabel(user);
  const activityLabel = user.fitnessProfile?.favoriteActivities?.split(',')[0]?.trim() || 'Movement';

  return (
    <TouchableOpacity activeOpacity={0.98} onPress={onPress} style={[styles.card, shadows.card]}>
      <View style={styles.imageContainer}>
        {primaryPhoto ? (
          <Image source={{ uri: primaryPhoto }} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient
            colors={['#1E293B', '#111827']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.placeholderImage}
          >
            <Text style={styles.initials}>{getAvatarInitial(user.firstName)}</Text>
          </LinearGradient>
        )}

        <View style={styles.cardFrame} pointerEvents="none" />
        <LinearGradient
          colors={['rgba(9,12,20,0.04)', 'rgba(9,12,20,0.18)', 'rgba(9,12,20,0.92)']}
          locations={[0, 0.42, 1]}
          style={styles.imageGradient}
          pointerEvents="none"
        />

        <View style={styles.topChrome}>
          <View style={styles.cardHandle} />
          <View style={styles.badgeRow}>
            <View style={styles.intentBadge}>
              <Text style={styles.intentBadgeText}>{intentLabel}</Text>
            </View>
            <View style={alignmentLabel ? styles.matchBadge : styles.presenceBadge}>
              {alignmentLabel ? (
                <>
                  <AppIcon name="star" size={12} color={DARK.background} />
                  <Text style={styles.matchBadgeText}>{alignmentLabel}</Text>
                </>
              ) : (
                <Text style={styles.presenceBadgeText}>{presenceLabel}</Text>
              )}
            </View>
          </View>

          {alignmentLabel ? (
            <View style={styles.presenceRow}>
              <View style={styles.presenceBadge}>
                <Text style={styles.presenceBadgeText}>{presenceLabel}</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomShell}>
          <Text style={styles.eyebrow}>{activityLabel.toUpperCase()} / CURATED MATCH</Text>
          <Text style={styles.name}>
            {user.firstName || 'Someone'}
            {user.age ? `, ${user.age}` : ''}
          </Text>
          <Text style={styles.metaLine}>
            {user.profile?.city || 'Nearby'}
            {user.distanceKm ? ` · ${Math.round(user.distanceKm)} km away` : ''}
          </Text>
          <Text style={styles.bio} numberOfLines={2}>
            {user.profile?.bio || 'Aligned on rhythm, intent, and the kind of plans that actually happen.'}
          </Text>

          <View style={styles.infoPanel}>
            <Text style={styles.infoPanelLabel}>PACE</Text>
            <Text style={styles.infoPanelValue}>{tempoLabel}</Text>
          </View>

          <View style={styles.chipRow}>
            {chips.length > 0 ? (
              chips.map((chip, index) => (
                <View key={`${chip}-${index}`} style={styles.chip}>
                  <Text style={styles.chipText}>{chip}</Text>
                </View>
              ))
            ) : (
              <View style={styles.chip}>
                <Text style={styles.chipText}>Nearby</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface SwipeDeckProps {
  data: any[];
  onSwipeLeft: (user: any) => void;
  onSwipeRight: (user: any) => void;
  onPress?: (user: any) => void;
}

export default function SwipeDeck({ data, onSwipeLeft, onSwipeRight, onPress }: SwipeDeckProps) {
  const swiperRef = useRef<Swiper<any>>(null);

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No new profiles tonight</Text>
        <Text style={styles.emptyText}>You have seen everyone nearby. Check back later for fresh momentum.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Swiper
        ref={swiperRef}
        cards={data}
        renderCard={(card) => <Card user={card} onPress={() => onPress && onPress(card)} />}
        onSwipedLeft={(index) => onSwipeLeft(data[index])}
        onSwipedRight={(index) => onSwipeRight(data[index])}
        cardIndex={0}
        backgroundColor="transparent"
        stackSize={3}
        stackSeparation={18}
        cardVerticalMargin={8}
        cardHorizontalMargin={20}
        containerStyle={styles.swiperContainer}
        animateOverlayLabelsOpacity
        animateCardOpacity
        disableTopSwipe
        disableBottomSwipe
        swipeBackCard
        overlayLabels={{
          left: {
            title: 'PASS',
            style: {
              label: styles.overlayReject,
              wrapper: styles.overlayWrapperLeft,
            },
          },
          right: {
            title: 'LIKE',
            style: {
              label: styles.overlayLike,
              wrapper: styles.overlayWrapperRight,
            },
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  swiperContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingBottom: spacing.xxxl,
  },
  card: {
    borderRadius: 30,
    backgroundColor: DARK.surface,
    overflow: 'hidden',
    height: CARD_HEIGHT,
    width: '100%',
    borderWidth: 1,
    borderColor: DARK.border,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: DARK.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 84,
    color: DARK.textPrimary,
    fontWeight: '800',
  },
  cardFrame: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    bottom: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DARK.borderStrong,
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topChrome: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
  },
  cardHandle: {
    alignSelf: 'center',
    width: 132,
    height: 18,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(30,39,58,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  intentBadge: {
    backgroundColor: 'rgba(13,17,23,0.64)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  intentBadgeText: {
    color: DARK.textPrimary,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  presenceBadge: {
    backgroundColor: 'rgba(13,17,23,0.48)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  presenceBadgeText: {
    color: DARK.textSecondary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  presenceRow: {
    marginTop: spacing.sm,
    alignItems: 'flex-end',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2E58E',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  matchBadgeText: {
    color: DARK.background,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bottomShell: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.xxxxl,
  },
  eyebrow: {
    fontSize: 10,
    color: DARK.textMuted,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: 40,
    fontWeight: '800',
    color: DARK.textPrimary,
    letterSpacing: -1.2,
    lineHeight: 44,
  },
  metaLine: {
    fontSize: typography.bodySmall,
    color: DARK.textSecondary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  bio: {
    fontSize: typography.body,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 24,
    marginTop: spacing.md,
    maxWidth: '90%',
  },
  infoPanel: {
    marginTop: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(18,24,36,0.56)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  infoPanelLabel: {
    color: DARK.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: spacing.xs,
  },
  infoPanelValue: {
    color: DARK.textPrimary,
    fontSize: typography.body,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.09)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chipText: {
    color: DARK.textPrimary,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
    backgroundColor: 'transparent',
  },
  emptyTitle: {
    color: DARK.textPrimary,
    fontSize: typography.h2,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyText: {
    color: DARK.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
    fontSize: typography.body,
  },
  overlayReject: {
    borderColor: DARK.danger,
    color: DARK.danger,
    borderWidth: 2,
    fontSize: 26,
    fontWeight: '900',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: 'rgba(13,17,23,0.70)',
  },
  overlayLike: {
    borderColor: DARK.accent,
    color: DARK.accent,
    borderWidth: 2,
    fontSize: 26,
    fontWeight: '900',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: 'rgba(13,17,23,0.70)',
  },
  overlayWrapperLeft: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginTop: 48,
    marginLeft: -12,
  },
  overlayWrapperRight: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginTop: 48,
    marginLeft: 12,
  },
});
