import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { ChatComposer } from '../features/chat/components/ChatComposer';
import { lightTheme } from '../theme/tokens';

const meta = {
  title: 'Chat/Composer',
  component: ChatComposer,
  decorators: [(Story) => <View style={{ flex: 1, justifyContent: 'flex-end', padding: 24, backgroundColor: '#FDFBF8' }}><Story /></View>],
} satisfies Meta<typeof ChatComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Prefilled: Story = {
  args: {
    message: 'Coffee after the run?',
    onChangeMessage: () => undefined,
    onSend: () => undefined,
    sending: false,
    theme: lightTheme,
  },
};

export const EmptyDraft: Story = {
  args: {
    message: '   ',
    onChangeMessage: () => undefined,
    onSend: () => undefined,
    sending: false,
    theme: lightTheme,
  },
};

export const Sending: Story = {
  args: {
    message: 'On my way.',
    onChangeMessage: () => undefined,
    onSend: () => undefined,
    sending: true,
    theme: lightTheme,
  },
};
