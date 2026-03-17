import React from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import type { ChatMessage } from '../../../api/types';
import type { Theme } from '../../../theme/tokens';
import { chatStyles as styles } from './chat.styles';
import { EventInviteCard } from './EventInviteCard';
import type { EventInviteCardProps } from './EventInviteCard';

/** Pattern for detecting event invite messages: [EVENT_INVITE:<eventId>] */
const EVENT_INVITE_PATTERN = /\[EVENT_INVITE:([^\]]+)\]/;

export function parseEventInviteMessage(text: string): string | null {
  const match = EVENT_INVITE_PATTERN.exec(text);
  return match ? match[1] : null;
}

const ChatBubble = React.memo(function ChatBubble({
  eventInvites,
  item,
  onNavigateToEvent,
  theme,
}: {
  eventInvites?: Record<string, EventInviteCardProps>;
  item: ChatMessage;
  onNavigateToEvent?: (eventId: string) => void;
  theme: Theme;
}) {
  const isMe = item.sender === 'me';
  const eventId = parseEventInviteMessage(item.text);

  if (eventId) {
    const inviteData = eventInvites?.[eventId];
    if (inviteData) {
      return (
        <EventInviteCard
          {...inviteData}
          isMe={isMe}
          onNavigateToEvent={onNavigateToEvent}
        />
      );
    }
    // Fallback: render as a styled card placeholder if we don't have event data yet
    return (
      <EventInviteCard
        eventId={eventId}
        title="Loading event..."
        location=""
        startsAt={new Date().toISOString()}
        status="pending"
        isMe={isMe}
        onNavigateToEvent={onNavigateToEvent}
      />
    );
  }

  return (
    <View
      style={[
        styles.bubble,
        isMe ? styles.bubbleMe : styles.bubbleThem,
      ]}
      accessibilityLabel={isMe ? `You said: ${item.text}` : `They said: ${item.text}`}
    >
      <Text style={[styles.bubbleText, { color: isMe ? '#FFFFFF' : '#2C2420' }]}>{item.text}</Text>
    </View>
  );
});

export function ChatMessageList({
  eventInvites,
  messages,
  onNavigateToEvent,
  onRefresh,
  refreshing,
  theme,
}: {
  eventInvites?: Record<string, EventInviteCardProps>;
  messages: ChatMessage[];
  onNavigateToEvent?: (eventId: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  theme: Theme;
}) {
  return (
    <FlatList
      data={messages}
      renderItem={({ item }) => (
        <ChatBubble
          eventInvites={eventInvites}
          item={item}
          onNavigateToEvent={onNavigateToEvent}
          theme={theme}
        />
      )}
      keyExtractor={(item) => item.id}
      inverted
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      windowSize={10}
      maxToRenderPerBatch={15}
      removeClippedSubviews={true}
      initialNumToRender={20}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    />
  );
}
