import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { normalizeApiError } from '../api/errors';
import type { EventSummary } from '../api/types';
import { eventsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import AppBackdrop from '../components/ui/AppBackdrop';
import AppButton from '../components/ui/AppButton';
import { radii, spacing, typography } from '../theme/tokens';
import AppIcon from '../components/ui/AppIcon';
import AppState from '../components/ui/AppState';
import AppNotificationButton from '../components/ui/AppNotificationButton';

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

const CATEGORIES = ['All', 'Events', 'Trails', 'Gyms', 'Spots', 'Community'] as const;

type ExploreCategory = typeof CATEGORIES[number];
type SpotTag = 'Trails' | 'Gyms';

const ACTIVITY_SPOTS: Array<{
  id: string;
  name: string;
  type: string;
  icon: AppIconName;
  distance: string;
  color: string;
  tags: SpotTag[];
}> = [
  { id: '1', name: 'Magic Island', type: 'Run + Swim', icon: 'navigation', distance: '0.9 mi', color: ACCENT, tags: ['Trails'] },
  { id: '2', name: 'Kapiolani Park', type: 'Beach Games', icon: 'circle', distance: '1.4 mi', color: '#F59E0B', tags: ['Trails'] },
  { id: '3', name: 'Koko Head District Park', type: 'Stairs', icon: 'map', distance: '6.1 mi', color: '#F87171', tags: ['Trails'] },
  { id: '4', name: 'Ala Moana Beach Park', type: 'Open Water', icon: 'droplet', distance: '1.1 mi', color: PRIMARY, tags: ['Trails'] },
  { id: '5', name: 'Kailua Beach', type: 'Paddle', icon: 'anchor', distance: '10.5 mi', color: '#7AA8B8', tags: ['Trails'] },
  { id: '6', name: 'Makapuu Trail', type: 'Sunrise Hike', icon: 'sunrise', distance: '9.8 mi', color: '#34D399', tags: ['Trails'] },
  { id: '7', name: 'Honolulu Strength Lab', type: 'Strength Training', icon: 'activity', distance: '2.2 mi', color: '#60A5FA', tags: ['Gyms'] },
  { id: '8', name: 'Kaimuki Boxing Club', type: 'Boxing + Conditioning', icon: 'target', distance: '3.9 mi', color: '#F97316', tags: ['Gyms'] },
  { id: '9', name: 'Kakaako Yoga Loft', type: 'Mobility + Flow', icon: 'sun', distance: '1.8 mi', color: '#A78BFA', tags: ['Gyms'] },
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

const TRAIL_EVENT_KEYWORDS = [
  'run',
  'running',
  'trail',
  'hike',
  'hiking',
  'cycle',
  'cycling',
  'swim',
  'swimming',
  'surf',
  'surfing',
  'paddle',
  'paddling',
  'beach',
  'ocean',
  'park',
  'endurance',
];

const GYM_EVENT_KEYWORDS = [
  'boxing',
  'strength',
  'pilates',
  'climb',
  'climbing',
  'dance',
  'yoga',
  'gym',
  'studio',
  'club',
  'fitness',
  'lab',
];

function getEventSearchText(event: EventSummary) {
  return `${event.category ?? ''} ${event.title} ${event.location}`.toLowerCase();
}

function matchesEventKeyword(event: EventSummary, keywords: string[]) {
  const haystack = getEventSearchText(event);
  return keywords.some((keyword) => haystack.includes(keyword));
}

function matchesEventCategory(event: EventSummary, activeCategory: ExploreCategory) {
  switch (activeCategory) {
    case 'All':
    case 'Events':
      return true;
    case 'Trails':
      return matchesEventKeyword(event, TRAIL_EVENT_KEYWORDS);
    case 'Gyms':
      return matchesEventKeyword(event, GYM_EVENT_KEYWORDS);
    case 'Spots':
    case 'Community':
      return false;
    default:
      return true;
  }
}

function matchesSpotCategory(
  spot: (typeof ACTIVITY_SPOTS)[number],
  activeCategory: ExploreCategory,
) {
  switch (activeCategory) {
    case 'All':
    case 'Spots':
      return true;
    case 'Trails':
      return spot.tags.includes('Trails');
    case 'Gyms':
      return spot.tags.includes('Gyms');
    case 'Events':
    case 'Community':
      return false;
    default:
      return true;
  }
}

function getEventSectionTitle(activeCategory: ExploreCategory) {
  switch (activeCategory) {
    case 'Trails':
      return 'Trail Events';
    case 'Gyms':
      return 'Gym Events';
    default:
      return 'Near You';
  }
}

function getEventEmptyDescription(activeCategory: ExploreCategory) {
  switch (activeCategory) {
    case 'Trails':
      return 'No trail-oriented events are live right now. Try again after a refresh.';
    case 'Gyms':
      return 'No gym-based events are live right now. Try again after a refresh.';
    default:
      return 'Create the first plan nearby or check back after a refresh.';
  }
}

function getSpotsSectionTitle(activeCategory: ExploreCategory) {
  switch (activeCategory) {
    case 'Trails':
      return 'Trail Spots';
    case 'Gyms':
      return 'Training Spaces';
    default:
      return 'Activity Spots';
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function getEventMeta(event: EventSummary) {
  const category = event.category?.toLowerCase() ?? '';
  if (category.includes('run')) {
    return { icon: 'navigation' as const, gradientColors: ['#34D399', '#059669'] as const };
  }
  if (category.includes('yoga')) {
    return { icon: 'sun' as const, gradientColors: ['#7C6AF7', '#4B3EBF'] as const };
  }
  if (category.includes('hike')) {
    return { icon: 'map' as const, gradientColors: ['#F59E0B', '#D97706'] as const };
  }
  if (category.includes('surf') || category.includes('swim')) {
    return { icon: 'wind' as const, gradientColors: ['#7AA8B8', '#4D6C78'] as const };
  }
  return { icon: 'calendar' as const, gradientColors: ['#7C6AF7', '#F59E0B'] as const };
}

function formatEventDate(startsAt: string) {
  const start = new Date(startsAt);
  return start.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function openMyEvents(navigation: any) {
  const parentNavigation = navigation.getParent?.();
  if (parentNavigation?.navigate) {
    parentNavigation.navigate('MyEvents');
    return;
  }

  navigation.navigate('MyEvents');
}

function EventCard({
  event,
  currentUserId,
  onOpen,
  onInvite,
}: {
  event: EventSummary;
  currentUserId?: string;
  onOpen: () => void;
  onInvite: () => void;
}) {
  const meta = getEventMeta(event);
  const isHostedByYou = event.host?.id === currentUserId;
  const statusLabel = isHostedByYou ? 'Hosted by you' : event.joined ? 'Going' : null;

  return (
    <Pressable style={styles.eventCard} onPress={onOpen}>
      {/* Full-bleed gradient hero banner */}
      <LinearGradient
        colors={[...meta.gradientColors, 'rgba(13,17,23,0.95)'] as any}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.eventBanner}
      >
        <View style={styles.eventBannerContent}>
          <View style={styles.eventIconWrap}>
            <AppIcon name={meta.icon} size={22} color="#FFFFFF" />
          </View>
          {(event.category || statusLabel) && (
            <View style={styles.bannerBadgeRow}>
              {!!event.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{event.category.toUpperCase()}</Text>
                </View>
              )}
              {statusLabel ? (
                <View style={[styles.categoryBadge, styles.stateBadge]}>
                  <Text style={styles.categoryBadgeText}>{statusLabel.toUpperCase()}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Event body */}
      <View style={styles.eventBody}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <View style={styles.eventMetaRow}>
          <View style={styles.eventMetaInline}>
            <AppIcon name="calendar" size={13} color={TEXT_SECONDARY} />
            <Text style={styles.eventMeta}>{formatEventDate(event.startsAt)}</Text>
          </View>
          <View style={styles.attendeesBadge}>
            <View style={styles.attendeesBadgeInner}>
              <AppIcon name="users" size={12} color={TEXT_MUTED} />
              <Text style={styles.attendeesBadgeText}>{event.attendeesCount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.eventActions}>
          <AppButton
            label={event.joined ? 'View again' : 'View event'}
            onPress={onOpen}
            variant={event.joined ? 'secondary' : 'accent'}
            style={styles.joinBtn}
          />
          <AppButton
            label="Share"
            onPress={onInvite}
            variant="ghost"
            style={styles.inviteBtn}
          />
        </View>
      </View>
    </Pressable>
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
          <TouchableOpacity
            style={[styles.inviteSmallBtn, { borderColor: post.color + '35' }]}
            onPress={onInvite}
            activeOpacity={0.8}
          >
            <Text style={[styles.inviteSmallText, { color: post.color }]}>Share idea</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ExploreScreen({ navigation }: any) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const [activeCategory, setActiveCategory] = useState<ExploreCategory>('All');
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await eventsApi.list();
      setEvents(response.data || []);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents]),
  );

  const handleInvite = async (event?: EventSummary) => {
    try {
      const message = event
        ? `Join me for ${event.title} on BRDG${event.location ? ` at ${event.location}` : ''}.`
        : "Join me on BRDG. Let's move together.";
      await Share.share({ message });
    } catch {
      // share sheet unavailable — silently ignore
    }
  };

  const filteredEvents = events.filter((event) => matchesEventCategory(event, activeCategory));
  const filteredSpots = ACTIVITY_SPOTS.filter((spot) => matchesSpotCategory(spot, activeCategory));
  const eventSectionTitle = getEventSectionTitle(activeCategory);
  const spotsSectionTitle = getSpotsSectionTitle(activeCategory);
  const showEvents = activeCategory === 'All' || activeCategory === 'Events' || activeCategory === 'Trails' || activeCategory === 'Gyms';
  const showSpots = activeCategory === 'All' || activeCategory === 'Trails' || activeCategory === 'Gyms' || activeCategory === 'Spots';
  const showCommunity = activeCategory === 'All' || activeCategory === 'Community';

  return (
    <SafeAreaView style={styles.container}>
      <AppBackdrop />
      {/* Ambient glow */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchEvents(true)}
            tintColor={PRIMARY}
          />
        }
      >

        <View style={styles.hero}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>CITY GUIDE / CURATED MOVEMENT</Text>
              <Text style={styles.heroTitle}>What's{'\n'}happening.</Text>
              <Text style={styles.heroSubtitle}>A cleaner browse with stronger editorial framing.</Text>
            </View>
            <AppNotificationButton
              unreadCount={unreadCount}
              onPress={() => navigation.navigate('Notifications')}
              style={styles.heroNotificationButton}
            />
          </View>
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
              <Text style={styles.sectionTitle}>{eventSectionTitle}</Text>
              <TouchableOpacity onPress={() => openMyEvents(navigation)}>
                <Text style={styles.seeAll}>My Events →</Text>
              </TouchableOpacity>
            </View>
            {loading ? (
              <AppState title="Loading events" loading />
            ) : error ? (
              <AppState
                title="Couldn't load events"
                description={error}
                actionLabel="Try again"
                onAction={fetchEvents}
                isError
              />
            ) : filteredEvents.length === 0 ? (
              <AppState
                title="No matching events yet"
                description={getEventEmptyDescription(activeCategory)}
                actionLabel="Create event"
                onAction={() => navigation.navigate('Create')}
              />
            ) : (
              filteredEvents.slice(0, 6).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  currentUserId={currentUserId}
                  onOpen={() => navigation.navigate('EventDetail', { eventId: event.id })}
                  onInvite={() => handleInvite(event)}
                />
              ))
            )}
          </View>
        )}

        {/* ── Activity Spots ── */}
        {showSpots && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{spotsSectionTitle}</Text>
            {filteredSpots.length === 0 ? (
              <View style={styles.spotsEmptyState}>
                <Text style={styles.spotsEmptyTitle}>No spots in this lane yet</Text>
                <Text style={styles.spotsEmptyCopy}>Try another filter or come back after the next refresh.</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.spotsRow}
                style={{ marginTop: spacing.md }}
              >
                {filteredSpots.map((spot) => (
                  <SpotCard key={spot.id} spot={spot} />
                ))}
              </ScrollView>
            )}
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
            {COMMUNITY_POSTS.slice(0, 2).map((post) => (
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
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  heroCopy: {
    flex: 1,
  },
  heroNotificationButton: {
    marginTop: spacing.xs,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3.5,
    color: ACCENT,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1.2,
    color: TEXT_PRIMARY,
    lineHeight: 40,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: typography.body,
    fontWeight: '500',
    color: TEXT_MUTED,
    lineHeight: 22,
    maxWidth: 290,
  },

  // Categories
  categoriesScroll: { marginBottom: spacing.md },
  categoriesRow: {
    paddingHorizontal: CARD_PADDING,
    gap: spacing.sm,
    paddingRight: CARD_PADDING,
  },
  categoryPill: {
    paddingHorizontal: 15,
    paddingVertical: 7,
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
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: spacing.md,
    overflow: 'hidden',
    backgroundColor: SURFACE,
  },
  eventBanner: {
    height: 88,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  eventBannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bannerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  eventIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  stateBadge: {
    backgroundColor: 'rgba(11,18,25,0.28)',
  },
  eventBody: {
    padding: spacing.md + 2,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: TEXT_PRIMARY,
    marginBottom: spacing.xs,
  },
  eventMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
    flex: 1,
    minHeight: 42,
    paddingHorizontal: spacing.lg,
  },
  inviteBtn: {
    minHeight: 42,
    paddingHorizontal: spacing.lg,
  },

  // Spots - horizontal scroll cards
  spotsRow: {
    gap: spacing.md,
    paddingRight: CARD_PADDING,
  },
  spotsEmptyState: {
    marginTop: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.md,
  },
  spotsEmptyTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  spotsEmptyCopy: {
    fontSize: typography.caption,
    color: TEXT_MUTED,
    lineHeight: 18,
  },
  spotCard: {
    width: SPOT_CARD_WIDTH,
    borderRadius: 18,
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
