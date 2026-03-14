import React, { useCallback, useState } from 'react';
import { Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { normalizeApiError } from '../api/errors';
import { useAuthStore } from '../store/authStore';
import { useUnreadNotificationCount } from '../features/notifications/hooks/useUnreadNotificationCount';
import { useExploreEvents } from '../features/events/hooks/useExploreEvents';
import type { MainTabScreenProps } from '../core/navigation/types';
import { ACTIVITY_SPOTS, type ExploreCategory } from '../features/events/explore/explore.data';
import { ExploreScreenContent } from '../features/events/explore/ExploreScreenContent';
import { getEventSectionTitle, getSpotsSectionTitle, matchesEventCategory, matchesSpotCategory } from '../features/events/explore/explore.helpers';

function openMyEvents(navigation: MainTabScreenProps<'Explore'>['navigation']) {
  const parentNavigation = navigation.getParent?.();
  if (parentNavigation?.navigate) {
    parentNavigation.navigate('MyEvents');
    return;
  }
  navigation.navigate('MyEvents');
}

export default function ExploreScreen({ navigation }: MainTabScreenProps<'Explore'>) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { unreadCount } = useUnreadNotificationCount();
  const [activeCategory, setActiveCategory] = useState<ExploreCategory>('All');
  const { events, error, isLoading, isRefetching, refetch } = useExploreEvents();
  const errorMessage = error ? normalizeApiError(error).message : null;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const filteredEvents = events.filter((event) => matchesEventCategory(event, activeCategory));
  const filteredSpots = ACTIVITY_SPOTS.filter((spot) => matchesSpotCategory(spot, activeCategory));

  return (
    <ExploreScreenContent
      activeCategory={activeCategory}
      currentUserId={currentUserId}
      errorMessage={errorMessage}
      eventSectionTitle={getEventSectionTitle(activeCategory)}
      events={filteredEvents}
      isLoading={isLoading}
      isRefreshing={isRefetching}
      onInvite={(event) => {
        const message = event
          ? `Join me for ${event.title} on BRDG${event.location ? ` at ${event.location}` : ''}.`
          : "Join me on BRDG. Let's move together.";
        void Share.share({ message }).catch(() => undefined);
      }}
      onOpenCreate={() => navigation.navigate('Create')}
      onOpenEvent={(eventId) => navigation.navigate('EventDetail', { eventId })}
      onOpenMyEvents={() => openMyEvents(navigation)}
      onPressNotifications={() => navigation.navigate('Notifications')}
      onRefresh={() => {
        void refetch();
      }}
      onSelectCategory={setActiveCategory}
      showCommunity={activeCategory === 'All' || activeCategory === 'Community'}
      showEvents={activeCategory === 'All' || activeCategory === 'Events' || activeCategory === 'Trails' || activeCategory === 'Gyms'}
      showSpots={activeCategory === 'All' || activeCategory === 'Trails' || activeCategory === 'Gyms' || activeCategory === 'Spots'}
      spots={filteredSpots}
      spotsSectionTitle={getSpotsSectionTitle(activeCategory)}
      unreadCount={unreadCount}
    />
  );
}
