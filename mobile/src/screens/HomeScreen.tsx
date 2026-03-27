import React, { useEffect, useMemo, useState } from 'react';
import { Screen, StatePanel } from '../design/primitives';
import { DiscoverySkeleton } from '../components/skeletons';
import { useSheetController } from '../design/sheets/useSheetController';
import { normalizeApiError } from '../api/errors';
import type { User } from '../api/types';
import { useAuthStore } from '../store/authStore';
import { useUnreadNotificationCount } from '../features/notifications/hooks/useUnreadNotificationCount';
import { useDiscoveryFeed } from '../features/discovery/hooks/useDiscoveryFeed';
import { useProfileCompleteness } from '../features/profile/hooks/useProfileCompleteness';
import type { MainTabScreenProps } from '../core/navigation/types';
import { HomeScreenContent } from '../features/discovery/components/HomeScreenContent';
import {
  triggerSelectionHaptic,
  triggerSheetCommitHaptic,
  triggerSuccessHaptic,
} from '../lib/interaction/feedback';
import { useTheme } from '../theme/useTheme';
import {
  buildDiscoveryFilters,
  countActiveFilters,
  FilterModalState,
  getGreeting,
  getIntentOption,
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
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAuthLoaded = useAuthStore((state) => !state.isLoading);
  const { unreadCount } = useUnreadNotificationCount();
  const [showMatch, setShowMatch] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<User | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilterKey>('all');
  const [appliedFilterState, setAppliedFilterState] = useState<FilterModalState>(DEFAULT_FILTER_STATE);
  const [draftFilterState, setDraftFilterState] = useState<FilterModalState>(DEFAULT_FILTER_STATE);
  const [cardHeight, setCardHeight] = useState<number | undefined>(undefined);
  const filtersSheet = useSheetController();

  const currentFilters = useMemo(
    () => buildDiscoveryFilters(activeQuickFilter, appliedFilterState),
    [activeQuickFilter, appliedFilterState],
  );
  const { error, feed, isActing, isLoading, likeUser, passUser, refetch, undoSwipe } =
    useDiscoveryFeed(currentFilters);
  const { score: completenessScore } = useProfileCompleteness();
  const errorMessage = error ? normalizeApiError(error).message : null;

  useEffect(() => {
    if (isAuthLoaded && user?.isOnboarded === false) {
      const timeout = setTimeout(() => navigation.navigate('Onboarding'), 100);
      return () => clearTimeout(timeout);
    }
  }, [isAuthLoaded, navigation, user]);

  const intentOption = getIntentOption(user);
  const activeFilterCount = countActiveFilters(currentFilters, appliedFilterState);

  if (isLoading) {
    return (
      <Screen backgroundColor={theme.background} padding={0}>
        <DiscoverySkeleton testID="discovery-skeleton" />
      </Screen>
    );
  }

  if (errorMessage) {
    return (
      <Screen backgroundColor={theme.background}>
        <StatePanel
          title="Couldn't load discovery"
          description={errorMessage}
          actionLabel="Try again"
          onAction={() => {
            void refetch();
          }}
          isError
        />
      </Screen>
    );
  }

  return (
    <HomeScreenContent
      activeFilterCount={activeFilterCount}
      activeQuickFilter={activeQuickFilter}
      cardHeight={cardHeight}
      feed={feed}
      filtersSheet={filtersSheet.sheetProps}
      filterState={draftFilterState}
      greeting={getGreeting(user?.firstName)}
      isActing={isActing}
      intentOption={intentOption}
      onApplyFilters={() => {
        void triggerSheetCommitHaptic();
        setAppliedFilterState(draftFilterState);
        filtersSheet.close();
      }}
      onOpenFilters={() => {
        setDraftFilterState(appliedFilterState);
        filtersSheet.open();
      }}
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
      onCardHeightChange={setCardHeight}
      onRefetch={() => {
        void refetch();
      }}
      onSwipeLeft={(profile) => {
        if (isActing) {
          return;
        }
        void triggerSelectionHaptic();
        passUser(profile.id).catch(() => {
          // Mutation onError already rolls back the optimistic update.
        });
      }}
      onSwipeRight={(profile) => {
        if (isActing) {
          return;
        }
        void triggerSelectionHaptic();
        likeUser(profile.id).then((response) => {
          if (response.status === 'match' && response.match) {
            void triggerSuccessHaptic();
            setMatchedProfile(profile);
            setMatchId(response.match.id);
            setShowMatch(true);
          }
        }).catch(() => {
          // Mutation onError already rolls back the optimistic update;
          // swallow here so the floating promise never rejects unhandled.
        });
      }}
      onToggleAvailability={(value) =>
        setDraftFilterState((current) => ({
          ...current,
          availability: toggleValue(current.availability, value),
        }))
      }
      onToggleGoal={(value) =>
        setDraftFilterState((current) => ({ ...current, goals: toggleValue(current.goals, value) }))
      }
      onToggleIntensity={(value) =>
        setDraftFilterState((current) => ({
          ...current,
          intensity: toggleValue(current.intensity, value),
        }))
      }
      onUndoAndClose={() => {
        if (isActing) {
          return;
        }
        void triggerSheetCommitHaptic();
        undoSwipe().catch(() => {
          // Swallow — undo failure is non-critical and the UI stays consistent.
        });
        filtersSheet.close();
      }}
      onUpdateDistanceKm={(value) => setDraftFilterState((current) => ({ ...current, distanceKm: value }))}
      onUpdateMaxAge={(value) => setDraftFilterState((current) => ({ ...current, maxAge: value }))}
      onUpdateMinAge={(value) => setDraftFilterState((current) => ({ ...current, minAge: value }))}
      completenessScore={completenessScore}
      onPressCompleteness={() => navigation.navigate('You' as never)}
      showMatch={showMatch}
      unreadCount={unreadCount}
    />
  );
}

export { buildDiscoveryFilters } from '../features/discovery/components/discoveryFilters';
