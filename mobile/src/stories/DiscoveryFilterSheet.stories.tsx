import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { Button } from '../design/primitives';
import { useSheetController } from '../design/sheets/useSheetController';
import {
  DiscoveryFilterSheet,
} from '../features/discovery/components/DiscoveryFilterSheet';
import type { FilterModalState } from '../features/discovery/components/discoveryFilters';
import { withStoryScreenFrame } from './support';

const defaultState: FilterModalState = {
  availability: ['morning'],
  distanceKm: '18',
  goals: ['strength', 'mobility'],
  intensity: ['moderate'],
  maxAge: '38',
  minAge: '24',
};

function DiscoveryFilterSheetStory({
  state,
}: {
  state: FilterModalState;
}) {
  const sheet = useSheetController();

  React.useEffect(() => {
    sheet.open();
  }, [sheet.open]);

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end', padding: 20 }}>
      <Button label="Open filters" onPress={sheet.open} variant="secondary" />
      <DiscoveryFilterSheet
        controller={sheet.sheetProps}
        state={state}
        onApply={() => undefined}
        onChangeAvailability={() => undefined}
        onChangeDistanceKm={() => undefined}
        onChangeGoals={() => undefined}
        onChangeIntensity={() => undefined}
        onChangeMaxAge={() => undefined}
        onChangeMinAge={() => undefined}
        onUndoSwipe={() => undefined}
      />
    </View>
  );
}

const meta = {
  title: 'Discovery/DiscoveryFilterSheet',
  component: DiscoveryFilterSheetStory,
  decorators: [withStoryScreenFrame({ height: 900 })],
  args: {
    state: defaultState,
  },
} satisfies Meta<typeof DiscoveryFilterSheetStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ExpandedSelections: Story = {
  args: {
    state: {
      availability: ['morning', 'evening'],
      distanceKm: '42',
      goals: ['strength', 'weight_loss', 'endurance'],
      intensity: ['low', 'moderate', 'high'],
      maxAge: '52',
      minAge: '21',
    },
  },
};

export const MinimumSelections: Story = {
  args: {
    state: {
      availability: [],
      distanceKm: '1',
      goals: [],
      intensity: [],
      maxAge: '18',
      minAge: '18',
    },
  },
};
