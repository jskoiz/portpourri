import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import AppButton from '../components/ui/AppButton';

const meta = {
  title: 'UI/AppButton',
  component: AppButton,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof AppButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    label: 'Join BRDG',
    onPress: () => undefined,
  },
};

export const Accent: Story = {
  args: {
    label: 'Create Activity',
    onPress: () => undefined,
    variant: 'accent',
  },
};
