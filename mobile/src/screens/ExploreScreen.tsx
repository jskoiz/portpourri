import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { triggerImpactHaptic, triggerSelectionHaptic } from '../lib/interaction/feedback';

/** Minimum ms between focus-triggered refetches to avoid excessive API calls. */
const FOCUS_REFETCH_INTERVAL_MS = 30_000;

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
  const lastFocusRefetchRef = useRef(0);
  const refetchRef = useRef(refetch);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFocusRefetchRef.current >= FOCUS_REFETCH_INTERVAL_MS) {
        lastFocusRefetchRef.current = now;
        void refetchRef.current();
      }
    }, []),
  );

  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  const filteredEvents = useMemo(
    () => events.filter((event) => matchesEventCategory(event, activeCategory)),
    [activeCategory, events],
  );
  const filteredSpots = useMemo(
    () => ACTIVITY_SPOTS.filter((spot) => matchesSpotCategory(spot, activeCategory)),
    [activeCategory],
  );
  const handleInvite = useCallback((event?: typeof events[number]) => {
    const message = event
      ? `Join me for ${event.title} on BRDG${event.location ? ` at ${event.location}` : ''}.`
      : "Join me on BRDG. Let's move together.";
    void Share.share({ message }).catch((err) => {
      console.warn('[ExploreScreen] Share failed:', err);
    });
  }, []);
  const handleOpenCreate = useCallback(() => {
    void triggerImpactHaptic();
    navigation.navigate('Create');
  }, [navigation]);
  const handleOpenEvent = useCallback((eventId: string, event: (typeof events)[number]) => {
    navigation.navigate('EventDetail', { eventId, event });
  }, [navigation]);
  const handleOpenMyEvents = useCallback(() => {
    void triggerImpactHaptic();
    openMyEvents(navigation);
  }, [navigation]);
  const handlePressNotifications = useCallback(() => {
    navigation.navigate('Notifications');
  }, [navigation]);
  const handleRefresh = useCallback(() => {
    void refetchRef.current();
  }, []);
  const handleSelectCategory = useCallback((category: ExploreCategory) => {
    void triggerSelectionHaptic();
    setActiveCategory(category);
  }, []);

  return (
    <ExploreScreenContent
      activeCategory={activeCategory}
      currentUserId={currentUserId}
      errorMessage={errorMessage}
      eventSectionTitle={getEventSectionTitle(activeCategory)}
      events={filteredEvents}
      isLoading={isLoading}
      isRefreshing={isRefetching}
      onInvite={handleInvite}
      onOpenCreate={handleOpenCreate}
      onOpenEvent={handleOpenEvent}
      onOpenMyEvents={handleOpenMyEvents}
      onPressNotifications={handlePressNotifications}
      onRefresh={handleRefresh}
      onSelectCategory={handleSelectCategory}
      showCommunity={activeCategory === 'All' || activeCategory === 'Community'}
      showEvents={activeCategory === 'All' || activeCategory === 'Events' || activeCategory === 'Trails' || activeCategory === 'Gyms'}
      showSpots={activeCategory === 'All' || activeCategory === 'Trails' || activeCategory === 'Gyms' || activeCategory === 'Spots'}
      spots={filteredSpots}
      spotsSectionTitle={getSpotsSectionTitle(activeCategory)}
      unreadCount={unreadCount}
    />
  );
}
