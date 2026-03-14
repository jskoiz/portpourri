import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { normalizeApiError } from '../api/errors';
import type { ChatMessage } from '../api/types';
import AppState from '../components/ui/AppState';
import AppBackButton from '../components/ui/AppBackButton';
import AppBackdrop from '../components/ui/AppBackdrop';
import AppIcon from '../components/ui/AppIcon';
import { useTheme } from '../theme/useTheme';
import { radii, spacing, typography } from '../theme/tokens';
import { useChatThread } from '../features/chat/hooks/useChatThread';
import type { RootStackScreenProps } from '../core/navigation/types';

function getActivityTag(user: any): string {
  const goal = user?.fitnessProfile?.primaryGoal;
  if (!goal) return '';
  const map: Record<string, string> = {
    strength: 'Strength',
    weight_loss: 'Conditioning',
    endurance: 'Endurance',
    mobility: 'Mobility',
    connection: 'Connection',
    performance: 'Performance',
    both: 'Open',
  };
  return map[goal] || '';
}

export default function ChatScreen() {
  const theme = useTheme();
  const navigation = useNavigation<RootStackScreenProps<'Chat'>['navigation']>();
  const route = useRoute<RootStackScreenProps<'Chat'>['route']>();
  const {
    matchId,
    user,
    prefillMessage,
  } = route.params;

  const photoUrl =
    user?.photoUrl ||
    user?.photos?.find?.((p: any) => p.isPrimary)?.storageKey ||
    user?.photos?.[0]?.storageKey;

  const activityTag = getActivityTag(user);

  const [message, setMessage] = useState(prefillMessage?.trim() ?? '');
  const [sendError, setSendError] = useState<string | null>(null);
  const {
    connectionStatus,
    error,
    loading,
    messages,
    refresh,
    refreshing,
    sendMessage: sendChatMessage,
    sending,
  } = useChatThread(matchId);
  const errorMessage = error ? normalizeApiError(error).message : null;

  useEffect(() => {
    if (prefillMessage?.trim()) {
      setMessage(prefillMessage.trim());
    }
  }, [prefillMessage]);

  const sendMessage = async () => {
    if (!message.trim() || sending) return;
    const text = message.trim();
    setMessage('');
    try {
      setSendError(null);
      await sendChatMessage(text);
    } catch (err) {
      setSendError(normalizeApiError(err).message);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isMe = item.sender === 'me';
    return (
      <View
        style={[
          styles.bubble,
          isMe ? styles.bubbleMe : styles.bubbleThem,
          isMe
            ? { backgroundColor: theme.primary }
            : { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.bubbleText, { color: isMe ? theme.white : theme.textPrimary }]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0D1117' }]} edges={['top']}>
      <AppBackdrop />

      {/* Top bar */}
      <View style={[styles.header, { backgroundColor: theme.surfaceGlass, borderBottomColor: theme.border }]}>
        <AppBackButton onPress={() => navigation.goBack()} style={styles.backBtn} />
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={[styles.headerAvatar, { borderColor: theme.primary }]}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.headerAvatar,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '700' }}>
              {user?.firstName?.[0] || '?'}
            </Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={[styles.headerEyebrow, { color: theme.textMuted }]}>MATCH CONVERSATION</Text>
          <Text style={[styles.headerName, { color: theme.textPrimary }]}>
            {user?.firstName || 'Chat'}
          </Text>
          {activityTag ? (
            <View style={[styles.headerTag, { backgroundColor: theme.primarySubtle, borderColor: theme.primary }]}>
              <Text style={[styles.headerTagText, { color: theme.primary }]}>{activityTag}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {loading ? (
        <AppState title="Loading messages" loading />
      ) : errorMessage && messages.length === 0 ? (
        <AppState title="Couldn't load messages" description={errorMessage} actionLabel="Retry" onAction={() => { void refresh(); }} />
      ) : (
        <FlashList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void refresh();
              }}
              tintColor={theme.primary}
            />
          }
        />
      )}

      {connectionStatus !== 'connected' ? (
        <Text style={[styles.statusNote, { color: theme.textMuted }]}>
          {connectionStatus === 'connecting' ? 'Connecting…' : 'Auto-refresh mode'}
        </Text>
      ) : null}
      {(sendError || errorMessage) && messages.length > 0 ? (
        <Text style={[styles.errorNote, { color: theme.danger }]}>
          {sendError || errorMessage}
        </Text>
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={10}
      >
        <View style={[styles.inputBar, { backgroundColor: theme.surfaceGlass, borderTopColor: theme.border }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
                color: theme.textPrimary,
              },
            ]}
            value={message}
            onChangeText={setMessage}
            placeholder="Say something…"
            placeholderTextColor={theme.textMuted}
            editable={!sending}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={sendMessage}
            disabled={sending || !message.trim()}
            style={[
              styles.sendBtn,
              {
                backgroundColor: message.trim() ? theme.primary : theme.surfaceElevated,
                shadowColor: message.trim() ? theme.primary : 'transparent',
                shadowOpacity: message.trim() ? 0.40 : 0,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              },
            ]}
          >
            <AppIcon name="arrow-up" size={16} color={message.trim() ? theme.white : theme.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  backBtn: {
    marginBottom: 0,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  headerName: {
    fontSize: typography.h3,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerTag: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: spacing.xs,
  },
  headerTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    maxWidth: '82%',
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  statusNote: {
    textAlign: 'center',
    fontSize: typography.caption,
    paddingVertical: spacing.xs,
  },
  errorNote: {
    textAlign: 'center',
    fontSize: typography.caption,
    paddingVertical: spacing.xs,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.body,
    minHeight: 48,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
