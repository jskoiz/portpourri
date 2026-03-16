import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { Input } from '../design/primitives';

const meta = {
  title: 'Design/Input',
  component: Input,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FDFBF8' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    value: 'jordan@example.com',
    onChangeText: () => undefined,
  },
};

export const Error: Story = {
  args: {
    label: 'Password',
    placeholder: 'At least 8 characters',
    value: 'short',
    error: 'Password must be at least 8 characters.',
    onChangeText: () => undefined,
  },
};
