import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { Button } from '../design/primitives';

const meta = {
  title: 'Design/Button',
  component: Button,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FDFBF8' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    label: 'Join BRDG',
    onPress: () => undefined,
  },
};

export const Secondary: Story = {
  args: {
    label: 'Maybe Later',
    onPress: () => undefined,
    variant: 'secondary',
  },
};

export const Accent: Story = {
  args: {
    label: 'Create Activity',
    onPress: () => undefined,
    variant: 'accent',
  },
};

export const Ghost: Story = {
  args: {
    label: 'Skip',
    onPress: () => undefined,
    variant: 'ghost',
  },
};

export const Danger: Story = {
  args: {
    label: 'Delete account',
    onPress: () => undefined,
    variant: 'danger',
  },
};
