import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { CreateSuccessCard } from '../features/events/create/CreateSuccessCard';
import { makeEventSummary, withStoryScreenFrame } from './support';

function CreateSuccessCardStory() {
  const event = makeEventSummary({
    title: 'Kakaako strength hour',
    location: 'Honolulu Strength Lab',
    startsAt: '2026-03-28T08:00:00.000Z',
  });

  return (
    <CreateSuccessCard
      event={event}
      onClear={() => undefined}
      onShare={() => undefined}
      onViewEvent={() => undefined}
    />
  );
}

const meta = {
  title: 'Events/CreateSuccessCard',
  component: CreateSuccessCardStory,
  decorators: [withStoryScreenFrame({ height: 400 })],
} satisfies Meta<typeof CreateSuccessCardStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
