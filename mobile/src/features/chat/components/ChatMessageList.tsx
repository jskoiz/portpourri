import React from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import type { ChatMessage } from '../../../api/types';
import { StatePanel } from '../../../design/primitives';
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

function stripEventInviteMarker(text: string) {
  const next = text.replace(EVENT_INVITE_PATTERN, '').trim();
  return next.length > 0 ? next : 'Sent an event invite';
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
  const senderLabel = isMe ? 'You' : 'Them';
  const eventId = parseEventInviteMessage(item.text);
  const inviteNote = eventId ? stripEventInviteMarker(item.text) : null;
  const showInviteNote = Boolean(
    inviteNote && inviteNote !== 'Sent an event invite',
  );

  if (eventId) {
    const inviteData = eventInvites?.[eventId];
    if (inviteData) {
      return (
        <View style={{ alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
          {showInviteNote ? (
            <View
              style={[
                styles.bubble,
                isMe ? styles.bubbleMe : styles.bubbleThem,
                { backgroundColor: isMe ? theme.textPrimary : theme.surface },
              ]}
              accessibilityLabel={`${senderLabel}: ${inviteNote}`}
            >
              <Text
                style={[
                  styles.bubbleText,
                  { color: isMe ? theme.textInverse : theme.textPrimary },
                ]}
              >
                {inviteNote}
              </Text>
            </View>
          ) : null}
          <EventInviteCard
            {...inviteData}
            isMe={isMe}
            onNavigateToEvent={onNavigateToEvent}
          />
        </View>
      );
    }
  }

  const bubbleText = eventId ? inviteNote ?? item.text : item.text;

  return (
    <View
      style={[
        styles.bubble,
        isMe ? styles.bubbleMe : styles.bubbleThem,
        { backgroundColor: isMe ? theme.textPrimary : theme.surface },
      ]}
      accessibilityLabel={`${senderLabel}: ${bubbleText}`}
    >
      <Text
        style={[
          styles.bubbleText,
          { color: isMe ? theme.textInverse : theme.textPrimary },
        ]}
      >
        {bubbleText}
      </Text>
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
      extraData={eventInvites}
      accessibilityRole="list"
      accessibilityLabel="Conversation messages"
      accessibilityHint="Newest messages appear at the bottom"
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
      showsVerticalScrollIndicator={false}
      windowSize={10}
      maxToRenderPerBatch={15}
      removeClippedSubviews
      initialNumToRender={20}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <StatePanel
            title="No messages yet"
            description="Send the first hello or share a plan to start the thread."
          />
        </View>
      }
      contentContainerStyle={[
        styles.listContent,
        messages.length === 0 ? styles.listContentEmpty : null,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
        />
      }
    />
  );
}
