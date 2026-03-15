import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { CreatePlanSummaryCard } from '../features/events/create/CreatePlanSummaryCard';

const meta = {
  title: 'Events/CreatePlanSummaryCard',
  component: CreatePlanSummaryCard,
  decorators: [(Story) => <View style={{ flex: 1, padding: 24 }}><Story /></View>],
} satisfies Meta<typeof CreatePlanSummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadyToPost: Story = {
  args: {
    selectedActivity: 'Run',
    selectedColor: '#34D399',
    selectedTime: 'Evening',
    selectedWhen: 'Tomorrow',
    where: 'Magic Island',
  },
};

