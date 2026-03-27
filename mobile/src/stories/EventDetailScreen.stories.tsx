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
