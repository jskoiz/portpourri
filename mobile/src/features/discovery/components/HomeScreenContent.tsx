import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { User } from '../../../api/types';
import SwipeDeck from '../../../components/SwipeDeck';
import MatchAnimation from '../../../components/MatchAnimation';
import AppBackdrop from '../../../components/ui/AppBackdrop';
import { StatePanel } from '../../../design/primitives';
import type { AppBottomSheetProps } from '../../../design/sheets/AppBottomSheet';
import { spacing } from '../../../theme/tokens';
import { HomeHero } from './HomeHero';
import { HomeQuickFilters } from './HomeQuickFilters';
import { DiscoveryFilterSheet } from './DiscoveryFilterSheet';
import { homeStyles as styles } from './home.styles';
import type { FilterModalState, QuickFilterKey } from './discoveryFilters';

const DEFAULT_CARD_HEIGHT = 520;
const MIN_CARD_HEIGHT = 360;
const MAX_CARD_HEIGHT = 680;

function clampCardHeight(value: number) {
  return Math.min(MAX_CARD_HEIGHT, Math.max(MIN_CARD_HEIGHT, Math.round(value)));
}

export function HomeScreenContent({
  activeFilterCount,
  activeQuickFilter,
  filtersSheet,
  filterState,
  feed,
  greeting,
  intentOption,
  onApplyFilters,
  onOpenFilters,
  onMatchAnimationFinish,
  onPressNotifications,
  onPressProfile,
  onQuickFilterPress,
  onRefetch,
  onSwipeLeft,
  onSwipeRight,
  onToggleAvailability,
  onToggleGoal,
  onToggleIntensity,
  onUndoAndClose,
  onUpdateDistanceKm,
  onUpdateMaxAge,
  onUpdateMinAge,
  showMatch,
  unreadCount,
}: {
  activeFilterCount: number;
  activeQuickFilter: QuickFilterKey;
  filtersSheet: Pick<
    AppBottomSheetProps,
    'onChangeIndex' | 'onDismiss' | 'onRequestClose' | 'refObject' | 'visible'
  >;
  filterState: FilterModalState;
  feed: User[];
  greeting: string;
  intentOption: { color: string; label: string };
  onApplyFilters: () => void;
  onOpenFilters: () => void;
  onMatchAnimationFinish: () => void;
  onPressNotifications: () => void;
  onPressProfile: (profile: User) => void;
  onQuickFilterPress: (filterId: QuickFilterKey) => void;
  onRefetch: () => void;
  onSwipeLeft: (profile: User) => void;
  onSwipeRight: (profile: User) => void;
  onToggleAvailability: (value: 'morning' | 'evening') => void;
  onToggleGoal: (value: string) => void;
  onToggleIntensity: (value: string) => void;
  onUndoAndClose: () => void;
  onUpdateDistanceKm: (value: string) => void;
  onUpdateMaxAge: (value: string) => void;
  onUpdateMinAge: (value: string) => void;
  showMatch: boolean;
  unreadCount: number;
}) {
  const [cardHeight, setCardHeight] = React.useState(DEFAULT_CARD_HEIGHT);
  const handleDeckAreaLayout = React.useCallback((event: { nativeEvent: { layout: { height: number } } }) => {
    const nextHeight = clampCardHeight(event.nativeEvent.layout.height - 2);
    setCardHeight((current) => (Math.abs(current - nextHeight) > 1 ? nextHeight : current));
  }, []);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <AppBackdrop />

      <HomeHero
        feedCount={feed.length}
        filterCount={activeFilterCount}
        greeting={greeting}
        intentOption={intentOption}
        onPressNotifications={onPressNotifications}
        unreadCount={unreadCount}
      />

      <HomeQuickFilters
        activeFilterCount={activeFilterCount}
        activeQuickFilter={activeQuickFilter}
        onPressFilter={onQuickFilterPress}
        onPressRefine={onOpenFilters}
      />

      <View style={styles.deckArea}>
        <View
          style={styles.deckAreaInner}
          onLayout={handleDeckAreaLayout}
        >
          {feed.length === 0 ? (
            <StatePanel
              title="You're all caught up"
              description="Pull again in a bit or explore events nearby."
              actionLabel="Refresh"
              onAction={onRefetch}
            />
          ) : (
            <SwipeDeck
              cardHeight={cardHeight}
              data={feed}
              onSwipeLeft={onSwipeLeft}
              onSwipeRight={onSwipeRight}
              onPress={onPressProfile}
            />
          )}
        </View>
      </View>

      <MatchAnimation visible={showMatch} onFinish={onMatchAnimationFinish} />

      <DiscoveryFilterSheet
        controller={filtersSheet}
        state={filterState}
        onApply={onApplyFilters}
        onChangeAvailability={onToggleAvailability}
        onChangeDistanceKm={onUpdateDistanceKm}
        onChangeGoals={onToggleGoal}
        onChangeIntensity={onToggleIntensity}
        onChangeMaxAge={onUpdateMaxAge}
        onChangeMinAge={onUpdateMinAge}
        onUndoSwipe={onUndoAndClose}
      />
    </SafeAreaView>
  );
}
