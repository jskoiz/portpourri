import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppBackdrop from '../components/ui/AppBackdrop';
import { Screen, StatePanel } from '../design/primitives';
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
  const refreshRef = React.useRef<() => Promise<unknown>>(async () => undefined);
  const sendMessageRef = React.useRef<(text: string) => Promise<unknown>>(async () => undefined);
  const emitTypingRef = React.useRef<() => void>(() => undefined);
  const quickActionsSheet = useSheetController();
  const reportSheet = useSheetController();
  const { block } = useBlock({
    onSuccess: () => navigation.goBack(),
  });
  const { connectionStatus, error, isTyping, loading, messages, refresh, sendMessage, sending, emitTyping } = useChatThread(matchId);
  const errorMessage = error ? normalizeApiError(error).message : null;
  const photoUrl = getPrimaryPhotoUri(user);
  const prefillText = useMemo(() => prefillMessage?.trim() ?? '', [prefillMessage]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);
  useEffect(() => {
    emitTypingRef.current = emitTyping;
  }, [emitTyping]);

  useEffect(() => {
    if (prefillText) {
      setMessage(prefillText);
    }
  }, [prefillText]);

  const handleManualRefresh = useCallback(async () => {
    try {
      setManualRefreshing(true);
      await refreshRef.current();
    } finally {
      setManualRefreshing(false);
    }
  }, []);
  const handleSendMessage = useCallback(async () => {
    const text = message.trim();
    if (!text || sending) return;

    try {
      setSendError(null);
      void triggerImpactHaptic();
      await sendMessageRef.current(text);
      setMessage(''); // Only clear on success
    } catch (err) {
      void triggerWarningHaptic();
      setSendError(normalizeApiError(err).message);
      // message stays in the input for retry
    }
  }, [message, sending]);
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleOpenProfile = useCallback(() => {
    navigation.navigate('ProfileDetail', { user, userId: user.id });
  }, [navigation, user]);
  const handleBlock = useCallback(() => {
    showBlockConfirmation(() => {
      void block({ targetUserId: user.id });
    });
  }, [block, user.id]);
  const handleOpenQuickActions = useCallback(() => quickActionsSheet.open(), [quickActionsSheet.open]);
  const handleReport = useCallback(() => reportSheet.open(), [reportSheet.open]);
  const handleChangeMessage = useCallback((text: string) => {
    setMessage(text);
    if (text.length > 0) emitTypingRef.current();
  }, []);
  const handleSelectMessage = useCallback((nextMessage: string) => {
    void triggerSheetCommitHaptic();
    setMessage(nextMessage);
  }, []);

  if (loading || (errorMessage && messages.length === 0)) {
    return (
      <Screen backgroundColor={theme.background} padding={0}>
        <ChatHeader
          activityTag={getActivityTag(user)}
          onBack={handleBack}
          onBlock={handleBlock}
          onOpenQuickActions={handleOpenQuickActions}
          onPressProfile={handleOpenProfile}
          onReport={handleReport}
          photoUrl={photoUrl}
          theme={theme}
          user={user}
        />
        <StatePanel
          title={loading ? 'Loading messages' : "Couldn't load messages"}
          description={loading ? undefined : errorMessage ?? undefined}
          actionLabel={loading ? undefined : 'Retry'}
          onAction={loading ? undefined : handleManualRefresh}
          isError={Boolean(errorMessage)}
          loading={loading}
        />
      </Screen>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <AppBackdrop />
      <ChatHeader
        activityTag={getActivityTag(user)}
        onBack={handleBack}
        onBlock={handleBlock}
        onOpenQuickActions={handleOpenQuickActions}
        onPressProfile={handleOpenProfile}
        onReport={handleReport}
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
        <Text style={[styles.statusNote, { color: theme.textMuted }]}>
          Typing…
        </Text>
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
          onChangeMessage={handleChangeMessage}
          onSend={handleSendMessage}
          sending={sending}
          theme={theme}
        />
      </KeyboardAvoidingView>
      <ChatQuickActionsSheet
        controller={quickActionsSheet.sheetProps}
        onClose={quickActionsSheet.close}
        onSelectMessage={handleSelectMessage}
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
