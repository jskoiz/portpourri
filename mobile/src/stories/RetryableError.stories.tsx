import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import type { NormalizedApiError } from '../api/errors';
import RetryableError from '../components/ui/RetryableError';
import { withStorySurface } from './support';

type RetryableErrorStoryArgs = {
  kind: NormalizedApiError['kind'];
  message: string;
  retryAfterSeconds?: number;
  hideRetry?: boolean;
};

function RetryableErrorStory({
  kind,
  message,
  retryAfterSeconds,
  hideRetry,
}: RetryableErrorStoryArgs) {
  const error: NormalizedApiError = {
    message,
    kind,
    isNetworkError: kind === 'network',
    isUnauthorized: kind === 'unauthorized',
    retryable: true,
    retryAfterSeconds,
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <RetryableError error={error} hideRetry={hideRetry} onRetry={() => undefined} />
    </View>
  );
}

const meta = {
  title: 'Components/RetryableError',
  component: RetryableErrorStory,
  decorators: [withStorySurface({ centered: false })],
  args: {
    kind: 'rate_limited',
    message: 'Too many requests. Please wait a moment and try again.',
    retryAfterSeconds: 12,
    hideRetry: false,
  },
} satisfies Meta<typeof RetryableErrorStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CoolingDown: Story = {};

export const ImmediateRetry: Story = {
  args: {
    kind: 'network',
    message: 'The connection dropped. Try again when you are back online.',
    retryAfterSeconds: undefined,
  },
};

export const HiddenRetry: Story = {
  args: {
    kind: 'forbidden',
    message: 'You do not have permission to make this change.',
    retryAfterSeconds: undefined,
    hideRetry: true,
  },
};
