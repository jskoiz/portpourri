import React from 'react';
import { View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import type { User } from '../../../api/types';
import SwipeDeck from '../../../components/SwipeDeck';
import MatchAnimation from '../../../components/MatchAnimation';
import { getFloatingTabBarReservedHeight } from '../../../design/layout/tabBarLayout';
import { ScreenScaffold, SectionBlock, StatePanel } from '../../../design/primitives';
import type { AppBottomSheetProps } from '../../../design/sheets/AppBottomSheet';
import { DiscoveryNudgeCard } from './DiscoveryNudgeCard';
import { HomeHero } from './HomeHero';
import { HomeQuickFilters } from './HomeQuickFilters';
import { DiscoveryFilterSheet } from './DiscoveryFilterSheet';
import { homeStyles as styles } from './home.styles';
import type { FilterModalState, QuickFilterKey } from './discoveryFilters';
import { clampCardHeight } from '../../../components/swipeDeck/swipeDeck.presentation';

const DEFAULT_CARD_HEIGHT = 520;

export function HomeScreenContent({
  activeFilterCount,
  activeQuickFilter,
  cardHeight,
  completenessScore,
  filtersSheet,
  filterState,
  feed,
  greeting,
  isActing,
  intentOption,
  onPressCompleteness,
  onApplyFilters,
  onOpenFilters,
  onMatchAnimationFinish,
  onPressNotifications,
  onPressProfile,
  onQuickFilterPress,
  onRefetch,
  onCardHeightChange,
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
  cardHeight?: number;
  filtersSheet: Pick<
    AppBottomSheetProps,
    'onChangeIndex' | 'onDismiss' | 'onRequestClose' | 'refObject' | 'visible'
  >;
  filterState: FilterModalState;
  feed: User[];
  greeting: string;
  intentOption: { color: string; label: string };
  isActing: boolean;
  completenessScore: number;
  onPressCompleteness: () => void;
  onApplyFilters: () => void;
  onOpenFilters: () => void;
  onMatchAnimationFinish: () => void;
  onPressNotifications: () => void;
  onPressProfile: (profile: User) => void;
  onQuickFilterPress: (filterId: QuickFilterKey) => void;
  onRefetch: () => void;
  onCardHeightChange?: (height: number) => void;
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
  const insets = React.useContext(SafeAreaInsetsContext);
  const resolvedCardHeight = clampCardHeight(cardHeight ?? DEFAULT_CARD_HEIGHT);
  const deckBottomInset = getFloatingTabBarReservedHeight(insets?.bottom ?? 0);
  const handleDeckAreaLayout = React.useCallback((event: { nativeEvent: { layout: { height: number } } }) => {
    const nextHeight = clampCardHeight(event.nativeEvent.layout.height - 2);
    if (Math.abs(resolvedCardHeight - nextHeight) > 1) {
      onCardHeightChange?.(nextHeight);
    }
  }, [onCardHeightChange, resolvedCardHeight]);

  return (
    <ScreenScaffold edges={['top', 'left', 'right']} style={styles.container}>
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

      <SectionBlock spacingMode="tight">
        <DiscoveryNudgeCard score={completenessScore} onPress={onPressCompleteness} />
      </SectionBlock>

      <View testID="discovery-deck-shell" style={[styles.deckArea, { paddingBottom: deckBottomInset }]}>
        <View
          style={styles.deckAreaInner}
          testID="discovery-deck-area"
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
              cardHeight={resolvedCardHeight}
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
        isActing={isActing}
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
    </ScreenScaffold>
  );
}
