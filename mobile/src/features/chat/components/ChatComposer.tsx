import React from 'react';
import { Pressable, View } from 'react-native';
import AppIcon from '../../../components/ui/AppIcon';
import { GlassView, Input } from '../../../design/primitives';
import type { Theme } from '../../../theme/tokens';
import { chatStyles as styles } from './chat.styles';

export const ChatComposer = React.memo(function ChatComposer({
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
  theme: Theme;
}) {
  const canSend = message.trim().length > 0;

  const handleSend = () => {
    if (!canSend || sending) {
      return;
    }

    onSend();
  };

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
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
        accessibilityLabel="Message input"
        accessibilityHint="Type your message here"
      />
      <Pressable
        onPress={handleSend}
        disabled={sending || !canSend}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        accessibilityHint="Sends the current message"
        accessibilityState={{ disabled: sending || !canSend }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
});
