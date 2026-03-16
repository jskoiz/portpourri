import React, { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Swiper from 'react-native-deck-swiper';
import { radii, spacing, typography } from '../theme/tokens';
import AppIcon from './ui/AppIcon';
import { getAvatarInitial, getPrimaryPhotoUri } from '../lib/profilePhotos';

const DEFAULT_CARD_HEIGHT = 520;
const MIN_CARD_HEIGHT = 360;
const MAX_CARD_HEIGHT = 680;

const LIGHT = {
  background: '#F8F7F4',
  surface: '#FFFFFF',
  border: 'rgba(0,0,0,0.06)',
  accent: '#10B981',
  danger: '#EF4444',
  textPrimary: '#1A1A1A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
};

interface SwipeDeckCardProps {
  cardHeight: number;
  onPress?: () => void;
  user: any;
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
  else if (user.fitnessProfile?.weeklyFrequencyBand) {
    chips.push(`${user.fitnessProfile.weeklyFrequencyBand}x/week`);
  }

  return chips.slice(0, 2);
};

const getIntentLabel = (user: any) => {
  if (user?.profile?.intentDating && user?.profile?.intentWorkout) return 'Open to both';
  if (user?.profile?.intentDating) return 'Dating';
  if (user?.profile?.intentWorkout) return 'Training';
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
  const frequencyLabel = frequency ? `${frequency}x/week` : null;
  const intensityLabel = intensity ? formatLabel(String(intensity).toLowerCase()) : null;

  if (frequencyLabel && intensityLabel) return `${frequencyLabel} • ${intensityLabel}`;
  if (frequencyLabel) return frequencyLabel;
  if (intensityLabel) return intensityLabel;
  return 'Intent-aware match';
};

const clampCardHeight = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return DEFAULT_CARD_HEIGHT;
  return Math.min(MAX_CARD_HEIGHT, Math.max(MIN_CARD_HEIGHT, Math.round(value)));
};

const SwipeDeckCard = ({ cardHeight, onPress, user }: SwipeDeckCardProps) => {
  const primaryPhoto = getPrimaryPhotoUri(user);
  const chips = profileChips(user);
  const compact = cardHeight < 390;
  const ultraCompact = cardHeight < 350;
  const visibleChips = ultraCompact ? [] : compact ? chips.slice(0, 1) : chips;
  const intentLabel = getIntentLabel(user);
  const presenceLabel = getPresenceLabel(user);
  const alignmentLabel = getAlignmentLabel(user.recommendationScore);
  const tempoLabel = getTempoLabel(user);
  const activityLabel = user.fitnessProfile?.favoriteActivities?.split(',')[0]?.trim() || 'Movement';

  return (
    <TouchableOpacity
      activeOpacity={0.96}
      onPress={onPress}
      style={[styles.card, { height: cardHeight }]}
    >
      <View style={styles.imageContainer}>
        {primaryPhoto ? (
          <Image
            source={{ uri: primaryPhoto }}
            style={styles.image}
            contentFit="cover"
            contentPosition={{ left: '48%', top: compact ? '38%' : '41%' }}
            transition={180}
          />
        ) : (
          <LinearGradient
            colors={['#E8E6E1', '#D9D6CF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.placeholderImage}
          >
            <Text style={styles.initials}>{getAvatarInitial(user.firstName)}</Text>
          </LinearGradient>
        )}

        <LinearGradient
          colors={['rgba(9,12,20,0.02)', 'rgba(9,12,20,0.14)', 'rgba(9,12,20,0.76)']}
          locations={[0, 0.48, 1]}
          style={styles.imageGradient}
          pointerEvents="none"
        />

        <View style={[styles.topChrome, compact && styles.topChromeCompact]}>
          <View style={styles.badgeRow}>
            <View style={[styles.intentBadge, compact && styles.intentBadgeCompact]}>
              <Text style={styles.intentBadgeText}>{intentLabel}</Text>
            </View>

            {alignmentLabel ? (
              <View style={[styles.matchBadge, compact && styles.matchBadgeCompact]}>
                <AppIcon name="star" size={12} color={LIGHT.textPrimary} />
                <Text style={styles.matchBadgeText}>{alignmentLabel}</Text>
              </View>
            ) : (
              <View style={[styles.presenceBadge, compact && styles.presenceBadgeCompact]}>
                <Text style={styles.presenceBadgeText}>{presenceLabel}</Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            styles.bottomShell,
            compact && styles.bottomShellCompact,
            ultraCompact && styles.bottomShellUltraCompact,
          ]}
        >
          {!ultraCompact ? (
            <Text style={styles.eyebrow}>{activityLabel.toUpperCase()} / CURATED MATCH</Text>
          ) : null}
          <Text style={[styles.name, compact && styles.nameCompact]}>
            {user.firstName || 'Someone'}
            {user.age ? `, ${user.age}` : ''}
          </Text>
          <Text style={styles.metaLine}>
            {user.profile?.city || 'Nearby'}
            {user.distanceKm ? ` · ${Math.round(user.distanceKm)} km away` : ''}
          </Text>
          <Text style={[styles.bio, compact && styles.bioCompact]} numberOfLines={ultraCompact ? 1 : 2}>
            {user.profile?.bio || 'Aligned on rhythm, intent, and the kind of plans that actually happen.'}
          </Text>
          <Text style={[styles.tempoLine, compact && styles.tempoLineCompact]}>{tempoLabel}</Text>

          <View style={[styles.chipRow, compact && styles.chipRowCompact]}>
            {(visibleChips.length > 0 ? visibleChips : ultraCompact ? [] : ['Nearby']).map((chip, index) => (
              <View key={`${chip}-${index}`} style={styles.chip}>
                <Text style={styles.chipText}>{chip}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface SwipeDeckProps {
  cardHeight?: number;
  data: any[];
  onPress?: (user: any) => void;
  onSwipeLeft: (user: any) => void;
  onSwipeRight: (user: any) => void;
}

export default function SwipeDeck({
  cardHeight,
  data,
  onSwipeLeft,
  onSwipeRight,
  onPress,
}: SwipeDeckProps) {
  const swiperRef = useRef<Swiper<any>>(null);
  const resolvedCardHeight = clampCardHeight(cardHeight);
  const resolvedCardFrameStyle = React.useMemo(
    () => ({
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      height: resolvedCardHeight,
    }),
    [resolvedCardHeight],
  );

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No new profiles tonight</Text>
        <Text style={styles.emptyText}>
          You have seen everyone nearby. Check back later for fresh momentum.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Swiper
        ref={swiperRef}
        animateCardOpacity
        animateOverlayLabelsOpacity
        backgroundColor="transparent"
        cardHorizontalMargin={0}
        cardIndex={0}
        cardVerticalMargin={0}
        cardStyle={resolvedCardFrameStyle}
        cards={data}
        containerStyle={styles.swiperContainer}
        disableBottomSwipe
        disableTopSwipe
        onSwipedLeft={(index) => onSwipeLeft(data[index])}
        onSwipedRight={(index) => onSwipeRight(data[index])}
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
        renderCard={(card) => (
          <SwipeDeckCard
            cardHeight={resolvedCardHeight}
            onPress={() => onPress && onPress(card)}
            user={card}
          />
        )}
        stackSeparation={14}
        stackSize={2}
        swipeBackCard
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
    overflow: 'visible',
  },
  card: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: LIGHT.surface,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: LIGHT.surface,
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
    color: LIGHT.textPrimary,
    fontWeight: '800',
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  topChrome: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
  },
  topChromeCompact: {
    top: spacing.lg,
    left: spacing.md,
    right: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  intentBadge: {
    maxWidth: '58%',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  intentBadgeCompact: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
  },
  intentBadgeText: {
    color: LIGHT.textPrimary,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  presenceBadge: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  presenceBadgeCompact: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
  },
  presenceBadgeText: {
    color: LIGHT.textSecondary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2E58E',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  matchBadgeCompact: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
  },
  matchBadgeText: {
    color: LIGHT.textPrimary,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bottomShell: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xxxl + spacing.md,
  },
  bottomShellCompact: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.xxxl,
  },
  bottomShellUltraCompact: {
    paddingBottom: spacing.sm,
    paddingTop: spacing.xxl + spacing.md,
  },
  eyebrow: {
    fontSize: 10,
    color: LIGHT.textMuted,
    fontWeight: '800',
    letterSpacing: 2.8,
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    color: LIGHT.textPrimary,
    letterSpacing: -1.1,
    lineHeight: 34,
  },
  nameCompact: {
    fontSize: 28,
    lineHeight: 30,
  },
  metaLine: {
    fontSize: typography.bodySmall,
    color: LIGHT.textSecondary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  bio: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 19,
    marginTop: spacing.sm,
    maxWidth: '92%',
  },
  bioCompact: {
    marginTop: spacing.xs,
    maxWidth: '96%',
  },
  tempoLine: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: spacing.sm,
  },
  tempoLineCompact: {
    marginTop: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chipRowCompact: {
    marginTop: spacing.xs,
  },
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
    backgroundColor: 'rgba(255,255,255,0.70)',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  chipText: {
    color: LIGHT.textPrimary,
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
    color: LIGHT.textPrimary,
    fontSize: typography.h2,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyText: {
    color: LIGHT.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
    fontSize: typography.body,
  },
  overlayReject: {
    borderColor: LIGHT.danger,
    color: LIGHT.danger,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '900',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  overlayLike: {
    borderColor: LIGHT.accent,
    color: LIGHT.accent,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '900',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  overlayWrapperLeft: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginTop: 40,
    marginLeft: -10,
  },
  overlayWrapperRight: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginTop: 40,
    marginLeft: 10,
  },
});
