import React from 'react';
import { Pressable, View } from 'react-native';
import AppIcon from '../../../components/ui/AppIcon';
import { Input } from '../../../design/primitives';
import { chatStyles as styles } from './chat.styles';

export function ChatComposer({
  message,
  onChangeMessage,
  onSend,
  sending,
  theme,
}: {
  message: string;
  onChangeMessage: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  theme: any;
}) {
  return (
    <View style={[styles.inputBar, { backgroundColor: theme.surfaceGlass, borderTopColor: theme.border }]}>
      <Input
        style={[
          styles.input,
          {
            color: theme.textPrimary,
          },
        ]}
        value={message}
        onChangeText={onChangeMessage}
        placeholder="Say something…"
        editable={!sending}
        returnKeyType="send"
        onSubmitEditing={onSend}
        blurOnSubmit={false}
      />
      <Pressable
        onPress={onSend}
        disabled={sending || !message.trim()}
        style={[
          styles.sendBtn,
          {
            backgroundColor: message.trim() ? theme.primary : theme.surfaceElevated,
            shadowColor: message.trim() ? theme.primary : 'transparent',
            shadowOpacity: message.trim() ? 0.4 : 0,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
          },
        ]}
      >
        <AppIcon name="arrow-up" size={16} color={message.trim() ? theme.white : theme.textMuted} />
      </Pressable>
    </View>
  );
}
