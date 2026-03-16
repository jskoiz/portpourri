import React from 'react';
import { Pressable, View } from 'react-native';
import AppIcon from '../../../components/ui/AppIcon';
import { GlassView, Input } from '../../../design/primitives';
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
  const canSend = message.trim().length > 0;

  return (
    <GlassView tier="thick" borderRadius={0} style={styles.inputBar}>
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
        autoCapitalize="sentences"
        autoCorrect
        returnKeyType="send"
        submitBehavior="submit"
        onSubmitEditing={onSend}
        blurOnSubmit={false}
      />
      <Pressable
        onPress={onSend}
        disabled={sending || !canSend}
      >
        <GlassView
          tier={canSend ? 'medium' : 'thin'}
          tint={canSend ? theme.primarySubtle : undefined}
          borderRadius={23}
          style={styles.sendBtn}
        >
          <AppIcon name="arrow-up" size={16} color={canSend ? theme.primary : theme.textMuted} />
        </GlassView>
      </Pressable>
    </GlassView>
  );
}
