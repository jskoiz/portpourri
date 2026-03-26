import React, { useCallback, useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  triggerImpactHaptic,
  triggerSheetCommitHaptic,
  triggerWarningHaptic,
} from '../lib/interaction/feedback';
import { getPrimaryPhotoUri } from '../lib/profilePhotos';
import { useTheme } from '../theme/useTheme';
import type { RootStackScreenProps } from '../core/navigation/types';
import { ReportSheet } from '../features/moderation/components/ReportSheet';
import { useBlock } from '../features/moderation/hooks/useBlock';
import { showBlockConfirmation } from '../features/moderation/components/BlockConfirmation';

export default function ChatScreen({ navigation, route }: RootStackScreenProps<'Chat'>) {
  const theme = useTheme();
  const { matchId, user, prefillMessage } = route.params;
  const [message, setMessage] = useState(prefillMessage?.trim() ?? '');
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const quickActionsSheet = useSheetController();
  const reportSheet = useSheetController();
  const { block, isLoading: isBlocking } = useBlock({
    onSuccess: () => navigation.goBack(),
  });
  const { connectionStatus, error, isTyping, loading, messages, refresh, sendMessage, sending, emitTyping } = useChatThread(matchId);
  const errorMessage = error ? normalizeApiError(error).message : null;
  const photoUrl = getPrimaryPhotoUri(user);

  useEffect(() => {
    if (prefillMessage?.trim()) {
      setMessage(prefillMessage.trim());
    }
  }, [prefillMessage]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || sending) return;
    const text = message.trim();

    try {
      setSendError(null);
      void triggerImpactHaptic();
      await sendMessage(text);
      setMessage('');  // Only clear on success
    } catch (err) {
      void triggerWarningHaptic();
      setSendError(normalizeApiError(err).message);
      // message stays in the input for retry
    }
  }, [message, sendMessage, sending]);

  const handleManualRefresh = useCallback(async () => {
    try {
      setManualRefreshing(true);
      await refresh();
    } finally {
      setManualRefreshing(false);
    }
  }, [refresh]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <AppBackdrop />
      <ChatHeader
        activityTag={getActivityTag(user)}
        onBack={() => navigation.goBack()}
        onBlock={() => {
          showBlockConfirmation(() => {
            void block({ blockedUserId: user.id });
          });
        }}
        onOpenQuickActions={quickActionsSheet.open}
        onReport={reportSheet.open}
        photoUrl={photoUrl}
        theme={theme}
        user={user}
      />

      {loading ? (
        <StatePanel title="Loading messages" loading />
      ) : errorMessage && messages.length === 0 ? (
        <StatePanel title="Couldn't load messages" description={errorMessage} actionLabel="Retry" onAction={() => { void handleManualRefresh(); }} />
      ) : (
        <ChatMessageList
          messages={messages}
onNavigateToEvent={(eventId) => navigation.navigate('EventDetail', { eventId })}
          onRefresh={() => { void handleManualRefresh(); }}
          refreshing={manualRefreshing}
          theme={theme}
        />
      )}

      {connectionStatus !== 'connected' ? (
        <Text
          style={[styles.statusNote, { color: theme.textMuted }]}
          accessibilityLiveRegion="polite"
        >
          {connectionStatus === 'connecting'
            ? 'Connecting…'
            : connectionStatus === 'reconnecting'
              ? 'Reconnecting…'
              : 'Auto-refresh mode'}
        </Text>
      ) : null}
      {isTyping ? (
        <Text style={[styles.statusNote, { color: theme.textMuted }]}>Typing…</Text>
      ) : null}
      {(sendError || errorMessage) && messages.length > 0 ? (
        <Text
          style={[styles.errorNote, { color: theme.danger }]}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          {sendError || errorMessage}
        </Text>
      ) : null}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ChatComposer
          message={message}
          onChangeMessage={(text) => {
            setMessage(text);
            if (text.length > 0) emitTyping();
          }}
          onSend={handleSendMessage}
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
      <ReportSheet
        controller={reportSheet.sheetProps}
        onClose={reportSheet.close}
        reportedUserId={user.id}
        matchId={matchId}
      />
    </SafeAreaView>
  );
}
