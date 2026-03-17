import React, { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { normalizeApiError } from '../api/errors';
import type { EventSummary } from '../api/types';
import { useAuthStore } from '../store/authStore';
import AppBackButton from '../components/ui/AppBackButton';
import AppBackdrop from '../components/ui/AppBackdrop';
import AppIcon from '../components/ui/AppIcon';
import { StatePanel } from '../design/primitives';
import { useTheme } from '../theme/useTheme';
import { radii, spacing, typography } from '../theme/tokens';
import { useMyEvents } from '../features/events/hooks/useMyEvents';
import type {
  MainTabParamList,
  RootStackScreenProps,
} from '../core/navigation/types';

type TabKey = 'Joined' | 'Created';
const TABS: TabKey[] = ['Joined', 'Created'];

const EMPTY_STATES: Record<
  TabKey,
  {
    icon: React.ComponentProps<typeof AppIcon>['name'];
    title: string;
    body: string;
    cta: string;
    route: keyof MainTabParamList;
  }
> = {
  Joined: {
    icon: 'calendar',
    title: 'No events joined yet',
    body: 'Find something that excites you and jump in.',
    cta: 'Explore Events',
    route: 'Explore',
  },
  Created: {
    icon: 'plus-circle',
    title: "You haven't hosted anything yet",
    body: 'Start an activity and invite people to move with you.',
    cta: 'Create Activity',
    route: 'Create',
  },
};

function formatDate(startsAt: string) {
  const parsed = new Date(startsAt);
  if (Number.isNaN(parsed.getTime())) {
    return 'Date TBD';
  }

  try {
    return parsed.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Date TBD';
  }
}

function normalizeEvents(data: unknown): EventSummary[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter(
    (item): item is EventSummary =>
      !!item &&
      typeof item === 'object' &&
      typeof (item as EventSummary).id === 'string' &&
      typeof (item as EventSummary).title === 'string',
  );
}

export default function MyEventsScreen({
  navigation,
}: RootStackScreenProps<'MyEvents'>) {
  const theme = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [activeTab, setActiveTab] = useState<TabKey>('Joined');
  const { error, events: rawEvents, isLoading: loading, isRefetching, refetch } =
    useMyEvents();
  const events = normalizeEvents(rawEvents);
  const errorMessage = error ? normalizeApiError(error).message : null;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const emptyMeta = EMPTY_STATES[activeTab];
  const createdEvents = currentUserId
    ? events.filter((event) => event.host?.id === currentUserId)
    : [];
  const joinedEvents = events.filter(
    (event) => event.joined && event.host?.id !== currentUserId,
  );
  const displayedEvents = activeTab === 'Joined' ? joinedEvents : createdEvents;
  const tabCounts = {
    Joined: joinedEvents.length,
    Created: createdEvents.length,
  } as const;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <AppBackdrop />

      <View style={styles.header}>
        {navigation.canGoBack() && <AppBackButton onPress={() => navigation.goBack()} />}
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: theme.accent }]}>EVENTS</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>My Events</Text>
        </View>
      </View>

      <View
        style={[
          styles.tabBar,
          { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
        ]}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && [styles.tabActive, { backgroundColor: theme.primary }],
              { minHeight: 44, justifyContent: 'center' },
            ]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
            accessibilityLabel={`${tab} events, ${tabCounts[tab]} items`}
          >
            <View style={styles.tabContent}>
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab ? theme.white : theme.textMuted },
                ]}
              >
                {tab}
              </Text>
              <View
                testID={`my-events-tab-${tab.toLowerCase()}-count`}
                style={[
                  styles.tabCount,
                  {
                    backgroundColor:
                      activeTab === tab
                        ? 'rgba(255,255,255,0.18)'
                        : theme.primarySubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    { color: activeTab === tab ? theme.white : theme.primary },
                  ]}
                >
                  {tabCounts[tab]}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <StatePanel title="Loading your events" loading />
      ) : errorMessage ? (
        <StatePanel
          title="Couldn't load events"
          description={errorMessage}
          actionLabel="Try again"
          onAction={() => {
            void refetch();
          }}
          isError
        />
      ) : displayedEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <View
            style={[
              styles.emptyIconWrap,
              { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
            ]}
          >
            <AppIcon name={emptyMeta.icon} size={24} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            {emptyMeta.title}
          </Text>
          <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
            {emptyMeta.body}
          </Text>
          <TouchableOpacity
            style={[styles.emptyCta, { backgroundColor: theme.primary, minHeight: 48 }]}
            onPress={() => navigation.navigate('Main', { screen: emptyMeta.route })}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={emptyMeta.cta}
          >
            <Text style={[styles.emptyCtaText, { color: theme.white }]}>
              {emptyMeta.cta}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlashList
          contentContainerStyle={styles.list}
          data={displayedEvents}
          overrideProps={{ estimatedItemSize: 200 }}
          keyExtractor={(item, index) => item.id || `event-${index}`}
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
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
              onPress={() => {
                if (!item.id) return;
                navigation.navigate('EventDetail', { eventId: item.id });
              }}
            >
              {!!item.category && (
                <View
                  style={[
                    styles.cardCategoryBar,
                    { backgroundColor: `${theme.primary}22` },
                  ]}
                >
                  <Text style={[styles.cardCategory, { color: theme.primary }]}>
                    {item.category}
                  </Text>
                </View>
              )}
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  {item.title}
                </Text>
                <View style={styles.cardMetaRow}>
                  <AppIcon name="calendar" size={13} color={theme.textSecondary} />
                  <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>
                    {formatDate(item.startsAt)}
                  </Text>
                </View>
                {!!item.location && (
                  <View style={styles.cardMetaRow}>
                    <AppIcon name="map-pin" size={13} color={theme.textMuted} />
                    <Text style={[styles.cardMeta, { color: theme.textMuted }]}>
                      {item.location}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 2.2,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.xxl,
    borderRadius: radii.pill,
    borderWidth: 1,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tabActive: {},
  tabText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  tabCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '800',
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl || 40,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.h3,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  emptyBody: {
    fontSize: typography.body,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  emptyCta: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: radii.pill,
  },
  emptyCtaText: {
    fontSize: typography.body,
    fontWeight: '800',
  },

  list: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl || 48,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardCategoryBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: typography.body,
    fontWeight: '800',
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },
  cardMeta: {
    fontSize: typography.bodySmall,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
});
