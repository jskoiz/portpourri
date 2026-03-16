import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { Chip } from '../design/primitives';

const meta = {
  title: 'Design/Chip',
  component: Chip,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FDFBF8' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    label: 'Running',
    active: true,
    accentColor: '#C4A882',
    onPress: () => undefined,
  },
};

export const Inactive: Story = {
  args: {
    label: 'Strength',
    active: false,
    onPress: () => undefined,
  },
};

export const ReadOnly: Story = {
  args: {
    label: 'Outdoors',
    active: true,
    interactive: false,
    accentColor: '#8BAA7A',
  },
};
