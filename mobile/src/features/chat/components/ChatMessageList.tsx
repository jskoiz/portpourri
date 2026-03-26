import React, { useMemo } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useQueries } from '@tanstack/react-query';
import type { ChatMessage } from '../../../api/types';
import type { Theme } from '../../../theme/tokens';
import { queryKeys } from '../../../lib/query/queryKeys';
import { eventsApi } from '../../../services/api';
import { chatStyles as styles } from './chat.styles';
import { EventInviteCard } from './EventInviteCard';
import type { EventInviteCardProps } from './EventInviteCard';

/** Pattern for detecting event invite messages: [EVENT_INVITE:<eventId>] */
const EVENT_INVITE_PATTERN = /\[EVENT_INVITE:([^\]]+)\]/;
/** Far-future placeholder so loading cards are never treated as expired. */
const PENDING_EVENT_STARTS_AT = '2099-01-01T00:00:00.000Z';

export function parseEventInviteMessage(text: string): string | null {
  const match = EVENT_INVITE_PATTERN.exec(text);
  return match ? match[1] : null;
}

function parseEventInviteContent(text: string) {
  const eventId = parseEventInviteMessage(text);
  if (!eventId) {
    return { eventId: null, noteText: null };
  }

  const noteText = text
    .replace(EVENT_INVITE_PATTERN, '')
    .trim();

  return {
    eventId,
    noteText: noteText.length > 0 ? noteText : null,
  };
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
const { eventId, noteText } = parseEventInviteContent(item.text);

  if (eventId) {
    const inviteData = eventInvites?.[eventId];
    if (inviteData) {
      return (
        <View style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', gap: 8 }}>
          {noteText ? (
            <View
              style={[
                styles.bubble,
                isMe ? styles.bubbleMe : styles.bubbleThem,
                { backgroundColor: isMe ? theme.textPrimary : theme.surface },
              ]}
              accessibilityLabel={`${senderLabel}: ${noteText}`}
            >
              <Text
                style={[
                  styles.bubbleText,
                  { color: isMe ? theme.textInverse : theme.textPrimary },
                ]}
              >
                {noteText}
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

    return (
<View style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', gap: 8 }}>
        {noteText ? (
          <View
            style={[
              styles.bubble,
              isMe ? styles.bubbleMe : styles.bubbleThem,
              { backgroundColor: isMe ? theme.textPrimary : theme.surface },
            ]}
            accessibilityLabel={`${senderLabel}: ${noteText}`}
          >
            <Text
              style={[
                styles.bubbleText,
                { color: isMe ? theme.textInverse : theme.textPrimary },
              ]}
            >
              {noteText}
            </Text>
          </View>
        ) : null}
        <EventInviteCard
          eventId={eventId}
          title="Loading event..."
          location=""
          startsAt={PENDING_EVENT_STARTS_AT}
          status="pending"
          isMe={isMe}
          onNavigateToEvent={onNavigateToEvent}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.bubble,
        isMe ? styles.bubbleMe : styles.bubbleThem,
        { backgroundColor: isMe ? theme.textPrimary : theme.surface },
      ]}
      accessibilityLabel={`${senderLabel}: ${item.text}`}
    >
      <Text
        style={[
          styles.bubbleText,
          { color: isMe ? theme.textInverse : theme.textPrimary },
        ]}
      >
        {item.text}
      </Text>
    </View>
  );
});

export const ChatMessageList = React.memo(function ChatMessageList({
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
const inviteEventIds = useMemo(
    () =>
      Array.from(
        new Set(
          messages
            .map((message) => parseEventInviteMessage(message.text))
            .filter((eventId): eventId is string => Boolean(eventId)),
        ),
      ),
    [messages],
  );
  const unresolvedInviteIds = useMemo(
    () =>
      inviteEventIds.filter((eventId) => !eventInvites?.[eventId]),
    [eventInvites, inviteEventIds],
  );
  const inviteQueries = useQueries({
    queries: unresolvedInviteIds.map((eventId) => ({
      queryKey: queryKeys.events.detail(eventId),
      queryFn: async () => (await eventsApi.detail(eventId)).data,
      staleTime: 60_000,
    })),
  });
  const resolvedEventInvites = useMemo(() => {
    const next: Record<string, EventInviteCardProps> = {
      ...(eventInvites ?? {}),
    };

    unresolvedInviteIds.forEach((eventId, index) => {
      const event = inviteQueries[index]?.data;
      if (!event) {
        return;
      }

      next[eventId] = {
        eventId,
        title: event.title,
        location: event.location,
        startsAt: event.startsAt,
        endsAt: event.endsAt ?? null,
        status: event.joined ? 'accepted' : 'pending',
        isMe: false,
      };
    });

    return next;
  }, [eventInvites, inviteQueries, unresolvedInviteIds]);

  return (
    <FlatList
      data={messages}
renderItem={({ item }) => (
        <ChatBubble
          eventInvites={resolvedEventInvites}
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
});
