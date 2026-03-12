import React, { useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, spacing, typography } from '../theme/tokens';
import AppIcon from '../components/ui/AppIcon';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_PADDING = spacing.xxl;

// ─── Design Tokens ────────────────────────────────────────────────────────────

const BASE = '#0D1117';
const SURFACE = '#161B22';
const SURFACE_ELEVATED = '#1C2128';
const BORDER = 'rgba(255,255,255,0.07)';
const PRIMARY = '#7C6AF7';
const ACCENT = '#34D399';
const TEXT_PRIMARY = '#F0F6FC';
const TEXT_SECONDARY = 'rgba(240,246,252,0.65)';
const TEXT_MUTED = 'rgba(240,246,252,0.38)';
type AppIconName = React.ComponentProps<typeof AppIcon>['name'];

// ─── Mock Data ────────────────────────────────────────────────────────────────

function formatUpcomingLabel(dayOffset: number, hour: number, minute = 0) {
  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + dayOffset);
  startsAt.setHours(hour, minute, 0, 0);

  const dateLabel = startsAt.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeLabel = startsAt.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${dateLabel} · ${timeLabel}`;
}

const MOCK_EVENTS: Array<{
  id: string;
  title: string;
  date: string;
  attendees: number;
  category: string;
  icon: AppIconName;
  gradientColors: readonly [string, string];
}> = [
  {
    id: '1',
    title: 'Ala Moana Sunrise Run Club',
    date: formatUpcomingLabel(1, 6),
    attendees: 18,
    category: 'Running',
    icon: 'navigation',
    gradientColors: ['#34D399', '#059669'] as const,
  },
  {
    id: '2',
    title: 'Golden Hour Rooftop Flow',
    date: formatUpcomingLabel(1, 18),
    attendees: 11,
    category: 'Yoga',
    icon: 'sun',
    gradientColors: ['#7C6AF7', '#4B3EBF'] as const,
  },
  {
    id: '3',
    title: 'Diamond Head Power Hike',
    date: formatUpcomingLabel(2, 17),
    attendees: 13,
    category: 'Hiking',
    icon: 'map',
    gradientColors: ['#F59E0B', '#D97706'] as const,
  },
  {
    id: '4',
    title: 'Kailua Paddle + Breakfast',
    date: formatUpcomingLabel(3, 8),
    attendees: 9,
    category: 'Paddling',
    icon: 'anchor',
    gradientColors: ['#7AA8B8', '#4D6C78'] as const,
  },
  {
    id: '5',
    title: 'Kaimuki Boxing Circuit Night',
    date: formatUpcomingLabel(3, 19),
    attendees: 8,
    category: 'Boxing',
    icon: 'target',
    gradientColors: ['#F87171', '#C2410C'] as const,
  },
  {
    id: '6',
    title: 'Beach Volleyball Sunset Social',
    date: formatUpcomingLabel(5, 17),
    attendees: 16,
    category: 'Volleyball',
    icon: 'circle',
    gradientColors: ['#7C6AF7', '#F59E0B'] as const,
  },
  {
    id: '7',
    title: 'North Shore Surf Carpool',
    date: formatUpcomingLabel(10, 6),
    attendees: 7,
    category: 'Surfing',
    icon: 'wind',
    gradientColors: ['#8AA9B2', '#56727A'] as const,
  },
  {
    id: '8',
    title: 'Manoa Reset Walk',
    date: formatUpcomingLabel(11, 17, 30),
    attendees: 10,
    category: 'Wellness',
    icon: 'heart',
    gradientColors: ['#34D399', '#047857'] as const,
  },
];

const ACTIVITY_SPOTS: Array<{
  id: string;
  name: string;
  type: string;
  icon: AppIconName;
  distance: string;
  color: string;
}> = [
  { id: '1', name: 'Magic Island', type: 'Run + Swim', icon: 'navigation', distance: '0.9 mi', color: ACCENT },
  { id: '2', name: 'Kapiolani Park', type: 'Beach Games', icon: 'circle', distance: '1.4 mi', color: '#F59E0B' },
  { id: '3', name: 'Koko Head District Park', type: 'Stairs', icon: 'map', distance: '6.1 mi', color: '#F87171' },
  { id: '4', name: 'Ala Moana Beach Park', type: 'Open Water', icon: 'droplet', distance: '1.1 mi', color: PRIMARY },
  { id: '5', name: 'Kailua Beach', type: 'Paddle', icon: 'anchor', distance: '10.5 mi', color: '#7AA8B8' },
  { id: '6', name: 'Makapuu Trail', type: 'Sunrise Hike', icon: 'sunrise', distance: '9.8 mi', color: '#34D399' },
];

const COMMUNITY_POSTS = [
  {
    id: '1',
    user: 'Leilani, 28',
    activity: 'Rooftop Flow',
    text: 'Have room for 2 more at a mellow Kakaako sunset yoga session tomorrow.',
    spots: 2,
    initial: 'L',
    color: PRIMARY,
  },
  {
    id: '2',
    user: 'Kai, 31',
    activity: 'Sunrise Run',
    text: '4-mile social pace at Ala Moana, coffee after if anyone wants to keep hanging.',
    spots: 4,
    initial: 'K',
    color: ACCENT,
  },
  {
    id: '3',
    user: 'Malia, 32',
    activity: 'Ocean Swim',
    text: 'Queen’s Beach buoy loop on Saturday. Comfortable swimmers welcome.',
    spots: 3,
    initial: 'M',
    color: '#7AA8B8',
  },
  {
    id: '4',
    user: 'Devon, 35',
    activity: 'Climb Night',
    text: 'Putting together a beginner-friendly climbing crew next week if you want in.',
    spots: 5,
    initial: 'D',
    color: '#F59E0B',
  },
  {
    id: '5',
    user: 'Tessa, 29',
    activity: 'Beach Games',
    text: 'Anyone down for casual doubles at Kapiolani around golden hour?',
    spots: 6,
    initial: 'T',
    color: '#F87171',
  },
];

const CATEGORIES = ['All', 'Events', 'Trails', 'Gyms', 'Spots', 'Community'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function EventCard({ event, onInvite }: { event: typeof MOCK_EVENTS[0]; onInvite: () => void }) {
  return (
    <View style={styles.eventCard}>
      {/* Full-bleed gradient hero banner */}
      <LinearGradient
        colors={[...event.gradientColors, 'rgba(13,17,23,0.95)'] as any}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.eventBanner}
      >
        <View style={styles.eventBannerContent}>
          <View style={styles.eventIconWrap}>
            <AppIcon name={event.icon} size={22} color="#FFFFFF" />
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{event.category.toUpperCase()}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Event body */}
      <View style={styles.eventBody}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <View style={styles.eventMetaRow}>
          <View style={styles.eventMetaInline}>
            <AppIcon name="calendar" size={13} color={TEXT_SECONDARY} />
            <Text style={styles.eventMeta}>{event.date}</Text>
          </View>
          <View style={styles.attendeesBadge}>
            <View style={styles.attendeesBadgeInner}>
              <AppIcon name="users" size={12} color={TEXT_MUTED} />
              <Text style={styles.attendeesBadgeText}>{event.attendees}</Text>
            </View>
          </View>
        </View>

        <View style={styles.eventActions}>
          <Pressable style={styles.joinBtn}>
            <LinearGradient
              colors={[event.gradientColors[0], event.gradientColors[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.joinBtnInner}
            >
              <Text style={styles.joinBtnText}>Join →</Text>
            </LinearGradient>
          </Pressable>
          <TouchableOpacity
            style={styles.inviteBtn}
            onPress={onInvite}
            activeOpacity={0.8}
          >
            <Text style={styles.inviteBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function SpotCard({ spot }: { spot: typeof ACTIVITY_SPOTS[0] }) {
  return (
    <View style={[styles.spotCard, { borderColor: spot.color + '30' }]}>
      <View style={[styles.spotIconWrap, { backgroundColor: spot.color + '18' }]}>
        <AppIcon name={spot.icon} size={18} color={spot.color} />
      </View>
      <Text style={styles.spotName} numberOfLines={1}>{spot.name}</Text>
      <Text style={styles.spotType}>{spot.type}</Text>
      <Text style={[styles.spotDistance, { color: spot.color }]}>{spot.distance}</Text>
    </View>
  );
}

function CommunityCard({ post, onInvite }: { post: typeof COMMUNITY_POSTS[0]; onInvite: () => void }) {
  return (
    <View style={styles.communityCard}>
      {/* Left accent strip */}
      <View style={[styles.communityAccentStrip, { backgroundColor: post.color }]} />

      <View style={styles.communityInner}>
        <View style={styles.communityHeader}>
          <View style={[styles.avatar, { backgroundColor: post.color + '25', borderColor: post.color + '50' }]}>
            <Text style={[styles.avatarText, { color: post.color }]}>{post.initial}</Text>
          </View>
          <View style={styles.communityMeta}>
            <Text style={styles.communityUser}>{post.user}</Text>
            <View style={[styles.activityPill, { backgroundColor: post.color + '18', borderColor: post.color + '40' }]}>
            <Text style={[styles.activityPillText, { color: post.color }]}>{post.activity}</Text>
          </View>
          </View>
          <View style={styles.spotsBadge}>
            <Text style={styles.spotsBadgeText}>{post.spots} open</Text>
          </View>
        </View>

        <Text style={styles.communityText}>{post.text}</Text>

        <View style={styles.communityActions}>
          <Pressable style={[styles.joinActivityBtn, { backgroundColor: post.color }]}>
            <Text style={styles.joinActivityText}>Join</Text>
          </Pressable>
          <TouchableOpacity
            style={styles.inviteSmallBtn}
            onPress={onInvite}
            activeOpacity={0.8}
          >
            <Text style={styles.inviteSmallText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ExploreScreen({ navigation }: any) {
  const [activeCategory, setActiveCategory] = useState('All');

  const handleInvite = async () => {
    try {
      await Share.share({ message: "Join me on BRDG. Let's move together." });
    } catch {
      navigation.navigate('Matches');
    }
  };

  const showEvents = activeCategory === 'All' || activeCategory === 'Events';
  const showSpots = activeCategory === 'All' || activeCategory === 'Trails' || activeCategory === 'Gyms' || activeCategory === 'Spots';
  const showCommunity = activeCategory === 'All' || activeCategory === 'Community';

  return (
    <SafeAreaView style={styles.container}>
      {/* Ambient glow */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Hero Header ── */}
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>EXPLORE</Text>
          <Text style={styles.heroTitle}>What's{'\n'}happening.</Text>
          <Text style={styles.heroSubtitle}>Events · spots · community</Text>
        </View>

        {/* ── Category Filter Row ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
          style={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryPill,
                activeCategory === cat ? styles.categoryPillActive : styles.categoryPillInactive,
              ]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  { color: activeCategory === cat ? '#FFFFFF' : TEXT_MUTED },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Events Section ── */}
        {showEvents && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Near You</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyEvents')}>
                <Text style={styles.seeAll}>My Events →</Text>
              </TouchableOpacity>
            </View>
            {MOCK_EVENTS.map((event) => (
              <EventCard key={event.id} event={event} onInvite={handleInvite} />
            ))}
          </View>
        )}

        {/* ── Activity Spots ── */}
        {showSpots && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Spots</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.spotsRow}
              style={{ marginTop: spacing.md }}
            >
              {ACTIVITY_SPOTS.map((spot) => (
                <SpotCard key={spot.id} spot={spot} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Community Feed ── */}
        {showCommunity && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Community</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Create')}>
                <Text style={[styles.seeAll, { color: ACCENT }]}>+ Post →</Text>
              </TouchableOpacity>
            </View>
            {COMMUNITY_POSTS.map((post) => (
              <CommunityCard key={post.id} post={post} onInvite={handleInvite} />
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const SPOT_CARD_WIDTH = 140;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BASE,
  },
  ambientGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: PRIMARY,
    opacity: 0.06,
  },
  scrollContent: {
    paddingBottom: 80,
  },

  // Hero
  hero: {
    paddingHorizontal: CARD_PADDING,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3.5,
    color: ACCENT,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.5,
    color: TEXT_PRIMARY,
    lineHeight: 48,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: TEXT_MUTED,
    letterSpacing: 0.5,
    textTransform: 'lowercase',
  },

  // Categories
  categoriesScroll: { marginBottom: spacing.lg },
  categoriesRow: {
    paddingHorizontal: CARD_PADDING,
    gap: spacing.sm,
    paddingRight: CARD_PADDING,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  categoryPillActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  categoryPillInactive: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: BORDER,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Section
  section: {
    paddingHorizontal: CARD_PADDING,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: TEXT_PRIMARY,
  },
  seeAll: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: PRIMARY,
  },

  // Event Card
  eventCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: spacing.md,
    overflow: 'hidden',
    backgroundColor: SURFACE,
  },
  eventBanner: {
    height: 120,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  eventBannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  eventIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#FFFFFF',
  },
  eventBody: {
    padding: spacing.lg,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
    color: TEXT_PRIMARY,
    marginBottom: spacing.sm,
  },
  eventMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  eventMetaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMeta: {
    fontSize: typography.caption,
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },
  attendeesBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: BORDER,
  },
  attendeesBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  attendeesBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eventActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  joinBtn: {
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  joinBtnInner: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 9,
    borderRadius: radii.pill,
  },
  joinBtnText: {
    fontSize: typography.bodySmall,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  inviteBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  inviteBtnText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: TEXT_MUTED,
  },

  // Spots - horizontal scroll cards
  spotsRow: {
    gap: spacing.md,
    paddingRight: CARD_PADDING,
  },
  spotCard: {
    width: SPOT_CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    backgroundColor: SURFACE,
  },
  spotIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  spotName: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  spotType: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  spotDistance: {
    fontSize: 11,
    fontWeight: '800',
  },

  // Community Card
  communityCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: spacing.md,
    overflow: 'hidden',
    backgroundColor: SURFACE,
    flexDirection: 'row',
  },
  communityAccentStrip: {
    width: 3,
  },
  communityInner: {
    flex: 1,
    padding: spacing.md,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.body,
    fontWeight: '900',
  },
  communityMeta: {
    flex: 1,
  },
  communityUser: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: 3,
  },
  activityPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  activityPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  spotsBadge: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
  },
  spotsBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: ACCENT,
  },
  communityText: {
    fontSize: typography.bodySmall,
    lineHeight: 20,
    color: TEXT_SECONDARY,
    marginBottom: spacing.md,
  },
  communityActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  joinActivityBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  joinActivityText: {
    fontSize: typography.bodySmall,
    fontWeight: '900',
    color: '#0D1117',
  },
  inviteSmallBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  inviteSmallText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
});
