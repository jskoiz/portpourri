import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { useRef } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { HomeScreenContent } from '../features/discovery/components/HomeScreenContent';
import type {
  FilterModalState,
  QuickFilterKey,
} from '../features/discovery/components/discoveryFilters';
import { makeDiscoveryUser, withStoryScreenFrame } from './support';

const filterState: FilterModalState = {
  availability: ['morning'],
  distanceKm: '16',
  goals: ['strength'],
  intensity: ['moderate'],
  maxAge: '38',
  minAge: '24',
};

function HomeScreenContentStory({
  activeQuickFilter = 'all',
  feedCount = 3,
  showMatch = false,
}: {
  activeQuickFilter?: QuickFilterKey;
  feedCount?: number;
  showMatch?: boolean;
}) {
  const refObject = useRef<BottomSheetModal | null>(null);
  const feed = Array.from({ length: feedCount }).map((_, index) =>
    makeDiscoveryUser({
      id: `discovery-${index + 1}`,
      firstName: ['Nia', 'Mason', 'Tessa'][index] ?? `Profile ${index + 1}`,
      distanceKm: 4 + index * 3,
      profile: {
        bio: index === 0
          ? 'Trail loops, movement dates, and coffee after.'
          : 'Compact plans and easy momentum.',
        city: ['Manoa', 'Kakaako', 'Kailua'][index] ?? 'Honolulu',
        intentDating: true,
        intentWorkout: true,
      },
    }),
  );

  return (
    <HomeScreenContent
      activeFilterCount={2}
      activeQuickFilter={activeQuickFilter}
      filtersSheet={{
        onChangeIndex: () => undefined,
        onDismiss: () => undefined,
        onRequestClose: () => undefined,
        refObject,
        visible: false,
      }}
      filterState={filterState}
      feed={feed}
      greeting="Evening, Lana"
      intentOption={{ color: '#8BAA7A', label: 'Open to both' }}
      onApplyFilters={() => undefined}
      onMatchAnimationFinish={() => undefined}
      onOpenFilters={() => undefined}
      onPressNotifications={() => undefined}
      onPressProfile={() => undefined}
      onQuickFilterPress={() => undefined}
      onRefetch={() => undefined}
      onSwipeLeft={() => undefined}
      onSwipeRight={() => undefined}
      onToggleAvailability={() => undefined}
      onToggleGoal={() => undefined}
      onToggleIntensity={() => undefined}
      onUndoAndClose={() => undefined}
      onUpdateDistanceKm={() => undefined}
      onUpdateMaxAge={() => undefined}
      onUpdateMinAge={() => undefined}
      showMatch={showMatch}
      unreadCount={4}
    />
  );
}

const meta = {
  title: 'Screens/HomeScreenContent',
  component: HomeScreenContentStory,
  decorators: [withStoryScreenFrame({ height: 900 })],
  args: {
    activeQuickFilter: 'all' as QuickFilterKey,
    feedCount: 3,
    showMatch: false,
  },
} satisfies Meta<typeof HomeScreenContentStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyState: Story = {
  args: {
    feedCount: 0,
  },
};

export const MatchMoment: Story = {
  args: {
    showMatch: true,
  },
};

export const SingleCard: Story = {
  args: {
    feedCount: 1,
  },
};
