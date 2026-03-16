import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { ChatHeader } from '../features/chat/components/ChatHeader';
import { ChatMessageList } from '../features/chat/components/ChatMessageList';
import { useTheme } from '../theme/useTheme';
import { makeChatMessage } from './support';
import { withStoryScreenFrame } from './support';

function ChatThreadStory() {
  const theme = useTheme();
  const messages = [
    makeChatMessage({
      id: 'message-1',
      sender: 'user-1',
      text: 'Want to do a sunrise run before work?',
    }),
    makeChatMessage({
      id: 'message-2',
      sender: 'me',
      text: 'Yes. Magic Island around 6:15?',
    }),
    makeChatMessage({
      id: 'message-3',
      sender: 'user-1',
      text: 'Perfect. I will bring coffee after.',
    }),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ChatHeader
        activityTag="Run"
        onBack={() => undefined}
        onOpenQuickActions={() => undefined}
        photoUrl="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80"
        theme={theme}
        user={{ firstName: 'Lana' }}
      />
      <ChatMessageList
        messages={messages}
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
