import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppBackdrop from '../components/ui/AppBackdrop';
import { StatePanel } from '../design/primitives';
import { normalizeApiError } from '../api/errors';
import { useChatThread } from '../features/chat/hooks/useChatThread';
import { ChatComposer } from '../features/chat/components/ChatComposer';
import { ChatHeader } from '../features/chat/components/ChatHeader';
import { ChatQuickActionsSheet } from '../features/chat/components/ChatQuickActionsSheet';
import { ChatMessageList } from '../features/chat/components/ChatMessageList';
import { getActivityTag } from '../features/chat/components/chat.helpers';
import { chatStyles as styles } from '../features/chat/components/chat.styles';
import { useSheetController } from '../design/sheets/useSheetController';
import {
  triggerSheetCommitHaptic,
  triggerWarningHaptic,
} from '../lib/interaction/feedback';
import { useTheme } from '../theme/useTheme';
import type { RootStackScreenProps } from '../core/navigation/types';

export default function ChatScreen() {
  const theme = useTheme();
  const navigation = useNavigation<RootStackScreenProps<'Chat'>['navigation']>();
  const route = useRoute<RootStackScreenProps<'Chat'>['route']>();
  const { matchId, user, prefillMessage } = route.params;
  const [message, setMessage] = useState(prefillMessage?.trim() ?? '');
  const [sendError, setSendError] = useState<string | null>(null);
  const quickActionsSheet = useSheetController();
  const { connectionStatus, error, loading, messages, refresh, refreshing, sendMessage, sending } = useChatThread(matchId);
  const errorMessage = error ? normalizeApiError(error).message : null;
  const photoUrl = user?.photoUrl || user?.photos?.find?.((photo: any) => photo.isPrimary)?.storageKey || user?.photos?.[0]?.storageKey;

  useEffect(() => {
    if (prefillMessage?.trim()) {
      setMessage(prefillMessage.trim());
    }
  }, [prefillMessage]);

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;
    const text = message.trim();
    setMessage('');

    try {
      setSendError(null);
      await sendMessage(text);
    } catch (err) {
      void triggerWarningHaptic();
      setSendError(normalizeApiError(err).message);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0D1117' }]} edges={['top']}>
      <AppBackdrop />
      <ChatHeader
        activityTag={getActivityTag(user)}
        onBack={() => navigation.goBack()}
        onOpenQuickActions={quickActionsSheet.open}
        photoUrl={photoUrl}
        theme={theme}
        user={user}
      />

      {loading ? (
        <StatePanel title="Loading messages" loading />
      ) : errorMessage && messages.length === 0 ? (
        <StatePanel title="Couldn't load messages" description={errorMessage} actionLabel="Retry" onAction={() => { void refresh(); }} />
      ) : (
        <ChatMessageList
          messages={messages}
          onRefresh={() => { void refresh(); }}
          refreshing={refreshing}
          theme={theme}
        />
      )}

      {connectionStatus !== 'connected' ? (
        <Text style={[styles.statusNote, { color: theme.textMuted }]}>
          {connectionStatus === 'connecting' ? 'Connecting…' : 'Auto-refresh mode'}
        </Text>
      ) : null}
      {(sendError || errorMessage) && messages.length > 0 ? (
        <Text style={[styles.errorNote, { color: theme.danger }]}>{sendError || errorMessage}</Text>
      ) : null}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={10}>
        <ChatComposer
          message={message}
          onChangeMessage={setMessage}
          onSend={() => { void handleSendMessage(); }}
          sending={sending}
          theme={theme}
        />
      </KeyboardAvoidingView>
      <ChatQuickActionsSheet
        controller={quickActionsSheet.sheetProps}
        onClose={quickActionsSheet.close}
        onSelectMessage={(nextMessage) => {
          void triggerSheetCommitHaptic();
          setMessage(nextMessage);
        }}
      />
    </SafeAreaView>
  );
}
