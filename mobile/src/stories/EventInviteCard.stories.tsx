import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { EventInviteCard } from '../features/chat/components/EventInviteCard';
import { withStorySurface } from './support';

function toIsoFromNow(daysFromNow: number) {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
}

const meta = {
  title: 'Chat/EventInviteCard',
  component: EventInviteCard,
  decorators: [withStorySurface({ centered: false, padding: 24 })],
  args: {
    eventId: 'event-1',
    title: 'Sunrise strength session',
    location: 'Kakaako Waterfront Park',
    startsAt: toIsoFromNow(7),
    endsAt: toIsoFromNow(7),
    status: 'pending',
    isMe: false,
    onNavigateToEvent: () => undefined,
  },
} satisfies Meta<typeof EventInviteCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PendingInvite: Story = {};

export const AcceptedInvite: Story = {
  args: {
    status: 'accepted',
  },
};

export const ExpiredInvite: Story = {
  args: {
    startsAt: toIsoFromNow(-7),
    status: 'pending',
  },
};

export const InviteFromMe: Story = {
  args: {
    isMe: true,
  },
};
