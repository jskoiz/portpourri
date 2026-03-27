import type { Meta, StoryObj } from '@storybook/react-native';
import { EventDetailView } from '../screens/EventDetailScreen';
import type { EventDetailViewProps } from '../screens/EventDetailScreen';
import { makeEventDetail, withStoryScreenFrame } from './support';

const baseArgs: EventDetailViewProps = {
  errorMessage: null,
  event: makeEventDetail(),
  isJoining: false,
  isLoading: false,
  onBack: () => undefined,
  onOpenAttendee: () => undefined,
  onJoin: () => undefined,
  onPressHost: () => undefined,
  onRefresh: () => undefined,
};

const meta = {
  title: 'Screens/EventDetail',
  component: EventDetailView,
  decorators: [withStoryScreenFrame({ height: 920, width: 430 })],
  args: baseArgs,
} satisfies Meta<typeof EventDetailView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: baseArgs,
};

export const Joined: Story = {
  args: {
    ...baseArgs,
    event: makeEventDetail({
      attendeesCount: 9,
      joined: true,
    }),
  },
};

export const WithAttendeeList: Story = {
  args: {
    ...baseArgs,
    event: makeEventDetail({
      attendeesCount: 12,
      attendees: [
        { id: 'host-1', firstName: 'Nia', photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80' },
        { id: 'attendee-2', firstName: 'Kai', photoUrl: null },
        { id: 'attendee-3', firstName: 'Malia', photoUrl: null },
        { id: 'attendee-4', firstName: 'Sage', photoUrl: null },
      ],
    }),
  },
};

export const JoinInProgress: Story = {
  args: {
    ...baseArgs,
    isJoining: true,
  },
};

export const Loading: Story = {
  args: {
    ...baseArgs,
    event: null,
    isLoading: true,
  },
};

export const ErrorState: Story = {
  args: {
    ...baseArgs,
    errorMessage: 'The event could not be loaded.',
    event: null,
  },
};
