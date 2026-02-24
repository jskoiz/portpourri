import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { colors, radii, shadows, spacing, typography } from '../theme/tokens';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_HEIGHT = Math.floor(SCREEN_HEIGHT * 0.48);

interface CardProps {
  user: any;
  onPress?: () => void;
}

const profileChips = (user: any) => {
  const chips = [];
  if (user.profile?.city) chips.push(user.profile.city);
  if (user.fitnessProfile?.primaryGoal) chips.push(user.fitnessProfile.primaryGoal);
  if (user.fitnessProfile?.intensityLevel) chips.push(user.fitnessProfile.intensityLevel);
  return chips.slice(0, 3);
};

const Card = ({ user, onPress }: CardProps) => {
  const primaryPhoto = user.photos?.find((p: any) => p.isPrimary)?.storageKey || user.photoUrl;
  const chips = profileChips(user);

  return (
    <TouchableOpacity activeOpacity={0.96} onPress={onPress} style={[styles.card, shadows.medium]}>
      <View style={styles.imageContainer}>
        {primaryPhoto ? (
          <Image source={{ uri: primaryPhoto }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.initials}>{user.firstName?.[0] || '?'}</Text>
          </View>
        )}

        <View style={styles.topBadges}>
          <View style={styles.badgePill}><Text style={styles.badgeText}>Active now</Text></View>
        </View>

        <View style={styles.overlay}>
          <Text style={styles.name}>{user.firstName || 'Someone'}, {user.age ?? '--'}</Text>
          <Text style={styles.bio} numberOfLines={2}>{user.profile?.bio || 'Looking for a compatible training partner.'}</Text>
          <View style={styles.chipRow}>
            {chips.length > 0 ? chips.map((chip) => (
              <View key={chip} style={styles.chip}><Text style={styles.chipText}>{chip}</Text></View>
            )) : <View style={styles.chip}><Text style={styles.chipText}>Nearby</Text></View>}
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
        <Text style={styles.emptyText}>You’ve seen everyone nearby. Check back soon for fresh faces.</Text>
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
        backgroundColor={colors.background}
        stackSize={3}
        stackSeparation={14}
        cardVerticalMargin={8}
        cardHorizontalMargin={16}
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
  container: { flex: 1, backgroundColor: colors.background },
  swiperContainer: { flex: 1, backgroundColor: colors.background, paddingBottom: spacing.xxxl },
  card: {
    borderRadius: radii.xxl,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    height: CARD_HEIGHT,
    width: '100%',
  },
  imageContainer: { flex: 1 },
  image: { width: '100%', height: '100%' },
  placeholderImage: { width: '100%', height: '100%', backgroundColor: colors.surfaceElevated, justifyContent: 'center', alignItems: 'center' },
  initials: { fontSize: 86, color: colors.textPrimary, fontWeight: '700' },
  topBadges: { position: 'absolute', top: spacing.lg, left: spacing.lg },
  badgePill: { backgroundColor: 'rgba(5,7,13,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  badgeText: { color: colors.accentSoft, fontSize: typography.caption, fontWeight: '800' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xl, backgroundColor: 'rgba(5,7,13,0.78)' },
  name: { fontSize: 33, fontWeight: '800', color: colors.textPrimary },
  bio: { fontSize: typography.bodySmall, color: colors.textSecondary, lineHeight: 20, marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  chip: { borderRadius: radii.pill, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  chipText: { color: colors.textPrimary, fontSize: typography.caption, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl },
  emptyTitle: { color: colors.textPrimary, fontSize: typography.h2, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },
  overlayReject: { borderColor: colors.danger, color: colors.danger, borderWidth: 2, fontSize: 30, fontWeight: '900', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.md },
  overlayLike: { borderColor: colors.success, color: colors.success, borderWidth: 2, fontSize: 30, fontWeight: '900', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.md },
  overlayWrapperLeft: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', marginTop: 42, marginLeft: -30 },
  overlayWrapperRight: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', marginTop: 42, marginLeft: 30 },
});
