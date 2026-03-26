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
      removeClippedSubviews
      initialNumToRender={20}
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
