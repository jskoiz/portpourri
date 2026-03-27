import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { ChatHeader } from '../features/chat/components/ChatHeader';
import type { EventInviteCardProps } from '../features/chat/components/EventInviteCard';
import { ChatMessageList } from '../features/chat/components/ChatMessageList';
import type { ChatMessage } from '../api/types';
import { useTheme } from '../theme/useTheme';
import { makeChatMessage } from './support';
import { withStoryScreenFrame } from './support';

type ChatThreadStoryProps = {
  eventInvites?: Record<string, EventInviteCardProps>;
  messages?: ChatMessage[];
};

const defaultMessages = [
  makeChatMessage({
    id: 'message-1',
    sender: 'them',
    text: 'Want to do a sunrise run before work?',
  }),
  makeChatMessage({
    id: 'message-2',
    sender: 'me',
    text: 'Yes. Magic Island around 6:15?',
  }),
  makeChatMessage({
    id: 'message-3',
    sender: 'them',
    text: 'Perfect. I will bring coffee after.',
  }),
];

function ChatThreadStory({
  eventInvites,
  messages = defaultMessages,
}: ChatThreadStoryProps) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ChatHeader
        activityTag="Run"
        onBack={() => undefined}
        onOpenQuickActions={() => undefined}
        onPressProfile={() => undefined}
        photoUrl="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80"
        theme={theme}
        user={{ id: 'user-1', firstName: 'Lana' }}
      />
      <ChatMessageList
        eventInvites={eventInvites}
        messages={messages}
        onNavigateToEvent={() => undefined}
        onRefresh={() => undefined}
        refreshing={false}
        theme={theme}
      />
    </View>
  );
}

const meta = {
  title: 'Chat/ChatThread',
  component: ChatThreadStory,
  decorators: [withStoryScreenFrame({ centered: false, height: 860 })],
} satisfies Meta<typeof ChatThreadStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyConversation: Story = {
  args: {
    messages: [],
  },
};

export const EventInviteConversation: Story = {
  args: {
    eventInvites: {
      'event-1': {
        eventId: 'event-1',
        title: 'Sunrise strength session',
        location: 'Kakaako Waterfront Park',
        startsAt: '2026-03-22T16:00:00.000Z',
        endsAt: '2026-03-22T18:00:00.000Z',
        status: 'pending',
        isMe: false,
      },
    },
    messages: [
      makeChatMessage({
        id: 'message-invite',
        sender: 'them',
        text: '[EVENT_INVITE:event-1]',
      }),
    ],
  },
};
