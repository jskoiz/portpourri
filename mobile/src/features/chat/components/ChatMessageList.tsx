import React from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { ChatMessage } from '../../../api/types';
import { chatStyles as styles } from './chat.styles';

function ChatBubble({ item, theme }: { item: ChatMessage; theme: any }) {
  const isMe = item.sender === 'me';

  return (
    <View
      style={[
        styles.bubble,
        isMe ? styles.bubbleMe : styles.bubbleThem,
        isMe ? { backgroundColor: theme.primary } : { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.bubbleText, { color: isMe ? theme.white : theme.textPrimary }]}>{item.text}</Text>
    </View>
  );
}

export function ChatMessageList({
  messages,
  onRefresh,
  refreshing,
  theme,
}: {
  messages: ChatMessage[];
  onRefresh: () => void;
  refreshing: boolean;
  theme: any;
}) {
  return (
    <FlashList
      data={messages}
      renderItem={({ item }) => <ChatBubble item={item} theme={theme} />}
      keyExtractor={(item) => item.id}
      inverted
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    />
  );
}

