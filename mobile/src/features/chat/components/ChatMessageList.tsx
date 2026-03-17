import React from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import type { ChatMessage } from '../../../api/types';
import type { Theme } from '../../../theme/tokens';
import { chatStyles as styles } from './chat.styles';

function ChatBubble({ item, theme }: { item: ChatMessage; theme: Theme }) {
  const isMe = item.sender === 'me';

  return (
    <View
      style={[
        styles.bubble,
        isMe ? styles.bubbleMe : styles.bubbleThem,
      ]}
    >
      <Text style={[styles.bubbleText, { color: isMe ? '#FFFFFF' : '#2C2420' }]}>{item.text}</Text>
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
  theme: Theme;
}) {
  return (
    <FlatList
      data={messages}
      renderItem={({ item }) => <ChatBubble item={item} theme={theme} />}
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
