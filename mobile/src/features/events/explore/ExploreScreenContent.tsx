import React from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { EventSummary } from '../../../api/types';
import AppBackdrop from '../../../components/ui/AppBackdrop';
import { useSheetController } from '../../../design/sheets/useSheetController';
import { StatePanel } from '../../../design/primitives';
import { ACTIVITY_SPOTS, COMMUNITY_POSTS, type ExploreCategory } from './explore.data';
import { EventCard, CommunityCard, SpotsRow } from './ExploreCards';
import { ExploreCategoryBar } from './ExploreCategoryBar';
import { ExploreHero } from './ExploreHero';
import { ExploreQuickActionsSheet } from './ExploreQuickActionsSheet';
import { getEventEmptyDescription } from './explore.helpers';
import { exploreStyles as styles } from './explore.styles';

export function ExploreScreenContent({
  activeCategory,
  currentUserId,
  errorMessage,
  eventSectionTitle,
  events,
  isLoading,
  isRefreshing,
  onInvite,
  onOpenCreate,
  onOpenEvent,
  onOpenMyEvents,
  onPressNotifications,
  onRefresh,
  onSelectCategory,
  showCommunity,
  showEvents,
  showSpots,
  spots,
  spotsSectionTitle,
  unreadCount,
}: {
  activeCategory: ExploreCategory;
  currentUserId?: string;
  errorMessage: string | null;
  eventSectionTitle: string;
  events: EventSummary[];
  isLoading: boolean;
  isRefreshing: boolean;
  onInvite: (event?: EventSummary) => void;
  onOpenCreate: () => void;
  onOpenEvent: (eventId: string) => void;
  onOpenMyEvents: () => void;
  onPressNotifications: () => void;
  onRefresh: () => void;
  onSelectCategory: (category: ExploreCategory) => void;
  showCommunity: boolean;
  showEvents: boolean;
  showSpots: boolean;
  spots: Array<(typeof ACTIVITY_SPOTS)[number]>;
  spotsSectionTitle: string;
  unreadCount: number;
}) {
  const quickActionsSheet = useSheetController();
  const visibleEvents = React.useMemo(() => events.slice(0, 6), [events]);
  const visibleCommunityPosts = React.useMemo(() => COMMUNITY_POSTS.slice(0, 2), []);
  const eventCards = React.useMemo(
    () =>
      visibleEvents.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          currentUserId={currentUserId}
          onOpen={() => onOpenEvent(event.id)}
          onInvite={() => onInvite(event)}
        />
      )),
    [currentUserId, onInvite, onOpenEvent, visibleEvents]
  );
  const communityCards = React.useMemo(
    () =>
      visibleCommunityPosts.map((post) => (
        <CommunityCard key={post.id} post={post} onInvite={() => onInvite()} />
      )),
    [onInvite, visibleCommunityPosts]
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppBackdrop />
      <View style={styles.ambientGlow} pointerEvents="none" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing && !isLoading} onRefresh={onRefresh} tintColor="#C4A882" />
        }
      >
        <ExploreHero
          unreadCount={unreadCount}
          onPressNotifications={onPressNotifications}
          onOpenQuickActions={quickActionsSheet.open}
        />
        <ExploreCategoryBar activeCategory={activeCategory} onSelectCategory={onSelectCategory} />

        {showEvents && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{eventSectionTitle}</Text>
              <TouchableOpacity onPress={onOpenMyEvents}>
                <Text style={styles.seeAll}>My Events →</Text>
              </TouchableOpacity>
            </View>
            {isLoading ? (
              <StatePanel title="Loading events" loading />
            ) : errorMessage ? (
              <StatePanel title="Couldn't load events" description={errorMessage} actionLabel="Try again" onAction={onRefresh} isError />
            ) : events.length === 0 ? (
              <StatePanel
                title="No matching events yet"
                description={getEventEmptyDescription(activeCategory)}
                actionLabel="Create event"
                onAction={onOpenCreate}
              />
            ) : (
              eventCards
            )}
          </View>
        )}

        {showSpots && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{spotsSectionTitle}</Text>
            {spots.length === 0 ? (
              <View style={styles.spotsEmptyState}>
                <Text style={styles.spotsEmptyTitle}>No spots in this lane yet</Text>
                <Text style={styles.spotsEmptyCopy}>Try another filter or come back after the next refresh.</Text>
              </View>
            ) : (
              <SpotsRow spots={spots} />
            )}
          </View>
        )}

        {showCommunity && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Community</Text>
              <TouchableOpacity onPress={onOpenCreate}>
                <Text style={[styles.seeAll, { color: '#8BAA7A' }]}>+ Post →</Text>
              </TouchableOpacity>
            </View>
            {communityCards}
          </View>
        )}
      </ScrollView>
      <ExploreQuickActionsSheet
        activeCategory={activeCategory}
        controller={quickActionsSheet.sheetProps}
        onClose={quickActionsSheet.close}
        onOpenCreate={onOpenCreate}
        onOpenMyEvents={onOpenMyEvents}
        onSelectCategory={onSelectCategory}
      />
    </SafeAreaView>
  );
}
