import React from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { User } from '../../../../api/types';
import { HomeScreenContent } from '../HomeScreenContent';
import type { FilterModalState, QuickFilterKey } from '../discoveryFilters';

jest.mock('../../../../components/SwipeDeck', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../../../components/MatchAnimation', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../../../components/ui/AppBackdrop', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../HomeHero', () => ({
  HomeHero: () => null,
}));

jest.mock('../DiscoveryNudgeCard', () => ({
  DiscoveryNudgeCard: () => null,
}));

jest.mock('../DiscoveryFilterSheet', () => ({
  DiscoveryFilterSheet: () => null,
}));

jest.mock('../../../../components/ui/AppIcon', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`} />;
  },
}));

const baseFilterState: FilterModalState = {
  availability: [],
  distanceKm: '50',
  goals: [],
  intensity: [],
  maxAge: '45',
  minAge: '21',
};

function renderHomeScreenContent(overrides: Partial<React.ComponentProps<typeof HomeScreenContent>> = {}) {
  const filtersSheet = {
    onChangeIndex: jest.fn(),
    onDismiss: jest.fn(),
    onRequestClose: jest.fn(),
    refObject: React.createRef<BottomSheetModal | null>(),
    visible: false,
  } as const;

  return render(
    <HomeScreenContent
      activeFilterCount={0}
      activeQuickFilter="all"
      completenessScore={45}
      filtersSheet={filtersSheet}
      filterState={baseFilterState}
      feed={[] as User[]}
      greeting="Evening, Lana"
      intentOption={{ color: '#8BAA7A', label: 'Open to both' }}
      onApplyFilters={jest.fn()}
      onMatchAnimationFinish={jest.fn()}
      onOpenFilters={jest.fn()}
      onPressCompleteness={jest.fn()}
      onPressNotifications={jest.fn()}
      onPressProfile={jest.fn()}
      onQuickFilterPress={jest.fn()}
      onRefetch={jest.fn()}
      onSwipeLeft={jest.fn()}
      onSwipeRight={jest.fn()}
      onToggleAvailability={jest.fn()}
      onToggleGoal={jest.fn()}
      onToggleIntensity={jest.fn()}
      onUndoAndClose={jest.fn()}
      onUpdateDistanceKm={jest.fn()}
      onUpdateMaxAge={jest.fn()}
      onUpdateMinAge={jest.fn()}
      showMatch={false}
      unreadCount={4}
      {...overrides}
    />,
  );
}

describe('HomeScreenContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the caught-up state and refreshes from the empty feed branch', () => {
    const onRefetch = jest.fn();
    renderHomeScreenContent({ onRefetch });

    expect(screen.getByText("You're all caught up")).toBeTruthy();
    expect(screen.getByText('Pull again in a bit or explore events nearby.')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Refresh'));

    expect(onRefetch).toHaveBeenCalledTimes(1);
  });

  it('forwards quick filter and refine actions from the screen controls', () => {
    const onOpenFilters = jest.fn();
    const onQuickFilterPress = jest.fn();

    renderHomeScreenContent({
      onOpenFilters,
      onQuickFilterPress,
    });

    fireEvent.press(screen.getByLabelText('Refine filters'));
    fireEvent.press(screen.getByLabelText('Filter by Strength'));

    expect(onOpenFilters).toHaveBeenCalledTimes(1);
    expect(onQuickFilterPress).toHaveBeenCalledWith('strength' as QuickFilterKey);
  });
});
