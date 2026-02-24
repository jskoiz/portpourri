import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import client from '../api/client';
import { normalizeApiError } from '../api/errors';
import type { ChatMessage } from '../api/types';
import { connectMatchMessageStream } from '../services/matchRealtime';
import AppState from '../components/ui/AppState';
import AppBackButton from '../components/ui/AppBackButton';
import { colors, radii, spacing, typography } from '../theme/tokens';

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { matchId, user } = route.params as { matchId: string; user: any };

  const photoUrl = user?.photoUrl || user?.photos?.find?.((p: any) => p.isPrimary)?.storageKey || user?.photos?.[0]?.storageKey;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'fallback'>('fallback');
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      const response = await client.get<ChatMessage[]>(`/matches/${matchId}/messages`);
      setMessages(response.data || []);
      setError(null);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, [matchId]);

  useEffect(() => { setLoading(true); fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    const stopPolling = () => { if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; } };
    const startPolling = () => { if (!pollTimerRef.current) pollTimerRef.current = setInterval(fetchMessages, 5000); };
    let disconnect: () => void = () => {};

    const setupRealtime = async () => {
      disconnect = await connectMatchMessageStream(matchId, {
        onStatus: (status) => {
          setConnectionStatus(status);
          if (status === 'connected') stopPolling(); else startPolling();
        },
        onMessage: (payload) => { if (payload?.type === 'message') fetchMessages(); },
        onError: () => { setConnectionStatus('fallback'); startPolling(); },
      });
    };

    setupRealtime();
    startPolling();
    return () => { disconnect(); stopPolling(); };
  }, [fetchMessages, matchId]);

  const sendMessage = async () => {
    if (!message.trim() || sending) return;
    const tempId = Date.now().toString();
    const text = message.trim();
    const tempMessage: ChatMessage = { id: tempId, text, sender: 'me', timestamp: new Date() };
    setMessages((prev) => [tempMessage, ...prev]);
    setMessage('');
    setSending(true);

    try {
      await client.post(`/matches/${matchId}/messages`, { content: text });
      await fetchMessages();
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError('Could not send message. Try again.');
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isMe = item.sender === 'me';
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <AppBackButton onPress={() => navigation.goBack()} />
        <View style={styles.headerInfo}>
          {photoUrl ? <Image source={{ uri: photoUrl }} style={styles.avatar} /> : <View style={styles.avatar} />}
          <Text style={styles.headerTitle}>{user?.firstName || 'Chat'}</Text>
        </View>
      </View>

      {loading ? (
        <AppState title="Loading messages" loading />
      ) : error && messages.length === 0 ? (
        <AppState title="Couldn’t load messages" description={error} actionLabel="Retry" onAction={fetchMessages} />
      ) : (
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchMessages(true)} tintColor={colors.primary} />}
        />
      )}

      {connectionStatus !== 'connected' ? (
        <Text style={styles.statusBanner}>{connectionStatus === 'connecting' ? 'Connecting to live chat…' : 'Using auto-refresh mode.'}</Text>
      ) : null}
      {error && messages.length > 0 ? <Text style={styles.banner}>{error}</Text> : null}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={10}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Send a message"
            placeholderTextColor={colors.textMuted}
            editable={!sending}
          />
          <TouchableOpacity onPress={sendMessage} style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]} disabled={sending || !message.trim()}>
            <Text style={styles.sendButtonText}>{sending ? '...' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  banner: { color: colors.danger, textAlign: 'center', paddingVertical: spacing.xs },
  statusBanner: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xs, fontSize: typography.caption },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerInfo: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  avatar: { width: 34, height: 34, borderRadius: 17, marginRight: spacing.sm, backgroundColor: colors.surfaceElevated },
  headerTitle: { color: colors.textPrimary, fontSize: typography.h3, fontWeight: '800' },
  listContent: { padding: spacing.lg },
  messageBubble: { padding: spacing.md, borderRadius: radii.lg, marginBottom: spacing.sm, maxWidth: '82%', borderWidth: 1 },
  myMessage: { backgroundColor: colors.primary, borderColor: '#B2A5FF', alignSelf: 'flex-end', borderBottomRightRadius: radii.sm },
  theirMessage: { backgroundColor: colors.surfaceGlass, borderColor: colors.border, alignSelf: 'flex-start', borderBottomLeftRadius: radii.sm },
  messageText: { color: colors.textPrimary, fontSize: typography.body },
  myMessageText: { color: colors.black, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    minHeight: 46,
  },
  sendButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText: { color: colors.accentSoft, fontWeight: '800', fontSize: typography.body },
});
