import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { SocialLoginButtons } from '../features/auth/components/SocialLoginButtons';
import { withStoryScreenFrame } from './support';

const meta = {
  title: 'Auth/SocialLoginButtons',
  component: SocialLoginButtons,
  decorators: [withStoryScreenFrame({ height: 300 })],
  args: {
    onGooglePress: () => undefined,
    onApplePress: () => undefined,
    googleLoading: false,
    appleLoading: false,
    googleReady: true,
    disabled: false,
  },
} satisfies Meta<typeof SocialLoginButtons>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const GoogleLoading: Story = {
  args: {
    googleLoading: true,
  },
};

export const AppleLoading: Story = {
  args: {
    appleLoading: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const GoogleNotReady: Story = {
  args: {
    googleReady: false,
  },
};
