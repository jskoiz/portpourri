import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { ErrorBoundary } from '../components/ErrorBoundary';
import LoadingState from '../components/LoadingState';
import MatchAnimation from '../components/MatchAnimation';
import { withStoryScreenFrame } from './support';

function CrashOnRender(): React.JSX.Element {
  throw new Error('Storybook fallback preview');
}

function FeedbackStory({
  showBoundaryError = true,
  showMatch = true,
  useCustomFallback = false,
}: {
  showBoundaryError?: boolean;
  showMatch?: boolean;
  useCustomFallback?: boolean;
}) {
  return (
    <View style={{ flex: 1, gap: 24, padding: 24 }}>
      <View style={{ height: 180, overflow: 'hidden', borderRadius: 24, backgroundColor: '#FDFBF8' }}>
        <LoadingState />
      </View>

      <View
        style={{
          height: 180,
          overflow: 'hidden',
          borderRadius: 24,
          padding: 20,
          backgroundColor: '#F7F4F0',
        }}
      >
        <ErrorBoundary
          fallback={
            useCustomFallback ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F160F' }}>Custom fallback</Text>
                <Text style={{ color: '#64584F' }}>Alternate recovery UI rendered by the boundary.</Text>
              </View>
            ) : undefined
          }
        >
          {showBoundaryError ? <CrashOnRender /> : <Text>No error state triggered.</Text>}
        </ErrorBoundary>
      </View>

      <View style={{ height: 240, overflow: 'hidden', borderRadius: 24, backgroundColor: '#2C2420' }}>
        <MatchAnimation onFinish={() => undefined} visible={showMatch} />
      </View>
    </View>
  );
}

const meta = {
  title: 'Components/Feedback',
  component: FeedbackStory,
  decorators: [withStoryScreenFrame({ centered: false, height: 920 })],
} satisfies Meta<typeof FeedbackStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const StaticBoundary: Story = {
  args: {
    showBoundaryError: false,
    showMatch: false,
  },
};

export const CustomBoundaryFallback: Story = {
  args: {
    showBoundaryError: true,
    showMatch: false,
    useCustomFallback: true,
  },
};
