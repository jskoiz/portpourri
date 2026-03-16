import React, { useEffect, useMemo, useState } from 'react';
import { StatePanel } from '../design/primitives';
import { useSheetController } from '../design/sheets/useSheetController';
import { normalizeApiError } from '../api/errors';
import type { User } from '../api/types';
import { useAuthStore } from '../store/authStore';
import { useUnreadNotificationCount } from '../features/notifications/hooks/useUnreadNotificationCount';
import { useDiscoveryFeed } from '../features/discovery/hooks/useDiscoveryFeed';
import type { MainTabScreenProps } from '../core/navigation/types';
import { HomeScreenContent } from '../features/discovery/components/HomeScreenContent';
import {
  triggerSelectionHaptic,
  triggerSheetCommitHaptic,
  triggerSuccessHaptic,
} from '../lib/interaction/feedback';
import {
  buildDiscoveryFilters,
  countActiveFilters,
  FilterModalState,
  getGreeting,
  getUserIntent,
  INTENT_OPTIONS,
  type QuickFilterKey,
} from '../features/discovery/components/discoveryFilters';

const DEFAULT_FILTER_STATE: FilterModalState = {
  availability: [],
  distanceKm: '50',
  goals: [],
  intensity: [],
  maxAge: '45',
  minAge: '21',
};

function toggleValue<T extends string>(current: T[], value: T) {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

export default function HomeScreen({ navigation }: MainTabScreenProps<'Discover'>) {
  const user = useAuthStore((state) => state.user);
  const { unreadCount } = useUnreadNotificationCount();
  const [showMatch, setShowMatch] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<User | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilterKey>('all');
  const [filterState, setFilterState] = useState<FilterModalState>(DEFAULT_FILTER_STATE);
  const filtersSheet = useSheetController();

  const currentFilters = useMemo(
    () => buildDiscoveryFilters(activeQuickFilter, filterState),
    [activeQuickFilter, filterState],
  );
  const { error, feed, isLoading, likeUser, passUser, refetch, undoSwipe } = useDiscoveryFeed(currentFilters);
  const errorMessage = error ? normalizeApiError(error).message : null;

  useEffect(() => {
    if (!user?.isOnboarded) {
      const timeout = setTimeout(() => navigation.navigate('Onboarding'), 100);
      return () => clearTimeout(timeout);
    }
  }, [navigation, user]);

  const intentOption = INTENT_OPTIONS.find((option) => option.value === getUserIntent(user)) || INTENT_OPTIONS[2];
  const activeFilterCount = countActiveFilters(currentFilters, filterState);

  if (isLoading) {
    return <StatePanel title="Tuning your feed" description="Finding people who match your pace." loading />;
  }

  if (errorMessage) {
    return (
      <StatePanel
        title="Couldn't load discovery"
        description={errorMessage}
        actionLabel="Try again"
        onAction={() => {
          void refetch();
        }}
        isError
      />
    );
  }

  return (
    <HomeScreenContent
      activeFilterCount={activeFilterCount}
      activeQuickFilter={activeQuickFilter}
      feed={feed}
      filtersSheet={filtersSheet.sheetProps}
      filterState={filterState}
      greeting={getGreeting(user?.firstName)}
      intentOption={intentOption}
      onApplyFilters={() => {
        void triggerSheetCommitHaptic();
        void refetch();
        filtersSheet.close();
      }}
      onOpenFilters={filtersSheet.open}
      onMatchAnimationFinish={() => {
        setShowMatch(false);
        if (matchedProfile && matchId) {
          navigation.navigate('Chat', { matchId, user: matchedProfile });
        }
        setMatchedProfile(null);
        setMatchId(null);
      }}
      onPressNotifications={() => navigation.navigate('Notifications')}
      onPressProfile={(profile) => navigation.navigate('ProfileDetail', { user: profile })}
      onQuickFilterPress={(filterId) =>
        {
          void triggerSelectionHaptic();
          setActiveQuickFilter((current) => (current === filterId ? 'all' : filterId));
        }
      }
      onRefetch={() => {
        void refetch();
      }}
      onSwipeLeft={(profile) => {
        void triggerSelectionHaptic();
        void passUser(profile.id);
      }}
      onSwipeRight={(profile) => {
        void triggerSelectionHaptic();
        void likeUser(profile.id).then((response) => {
          if (response.status === 'match' && response.match) {
            void triggerSuccessHaptic();
            setMatchedProfile(profile);
            setMatchId(response.match.id);
            setShowMatch(true);
          }
        });
      }}
      onToggleAvailability={(value) =>
        setFilterState((current) => ({
          ...current,
          availability: toggleValue(current.availability, value),
        }))
      }
      onToggleGoal={(value) =>
        setFilterState((current) => ({ ...current, goals: toggleValue(current.goals, value) }))
      }
      onToggleIntensity={(value) =>
        setFilterState((current) => ({
          ...current,
          intensity: toggleValue(current.intensity, value),
        }))
      }
      onUndoAndClose={() => {
        void triggerSheetCommitHaptic();
        void undoSwipe().then((response) => {
          if (response.status === 'undone') {
            void refetch();
          }
        });
        filtersSheet.close();
      }}
      onUpdateDistanceKm={(value) => setFilterState((current) => ({ ...current, distanceKm: value }))}
      onUpdateMaxAge={(value) => setFilterState((current) => ({ ...current, maxAge: value }))}
      onUpdateMinAge={(value) => setFilterState((current) => ({ ...current, minAge: value }))}
      showMatch={showMatch}
      unreadCount={unreadCount}
    />
  );
}

export { buildDiscoveryFilters } from '../features/discovery/components/discoveryFilters';
