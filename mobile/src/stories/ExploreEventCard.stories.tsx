import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { EventCard } from '../features/events/explore/ExploreCards';

const meta = {
  title: 'Events/ExploreEventCard',
  component: EventCard,
  decorators: [(Story) => <View style={{ flex: 1, padding: 24, backgroundColor: '#F8F7F4' }}><Story /></View>],
} satisfies Meta<typeof EventCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    currentUserId: 'user-1',
    event: {
      id: 'event-1',
      title: 'Makapuu Sunrise Hike',
      location: 'Makapuu Trail',
      category: 'Hiking',
      startsAt: '2026-03-15T16:00:00.000Z',
      host: { id: 'host-2', firstName: 'Nia' },
      attendeesCount: 4,
      joined: false,
    } as any,
    onInvite: () => undefined,
    onOpen: () => undefined,
  },
};

