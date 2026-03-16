import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { StatePanel } from '../design/primitives';

const meta = {
  title: 'Design/StatePanel',
  component: StatePanel,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FDFBF8' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof StatePanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    title: 'Loading discovery',
    loading: true,
  },
};

export const Error: Story = {
  args: {
    title: 'Could not load events',
    description: 'Network request timed out.',
    actionLabel: 'Retry',
    onAction: () => undefined,
    isError: true,
  },
};
