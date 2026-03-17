import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatMessage } from '../../../api/types';
import { matchesApi } from '../../../services/api';
import { connectMatchMessageStream } from '../../../services/matchRealtime';
import { queryKeys } from '../../../lib/query/queryKeys';
import { connectSocket, disconnectSocket, getSocket } from '../../../lib/socket';

type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

const TYPING_DEBOUNCE_MS = 2000;

export function useChatThread(matchId: string) {
  const queryClient = useQueryClient();
  const messageKey = queryKeys.matches.messages(matchId);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingEmittedRef = useRef(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [isTyping, setIsTyping] = useState(false);

  const query = useQuery({
    enabled: Boolean(matchId),
    queryKey: messageKey,
    queryFn: async () => (await matchesApi.getMessages(matchId)).data || [],
    staleTime: 0,
  });

  const refetchRef = useRef(query.refetch);
  refetchRef.current = query.refetch;

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  // Emit typing:start / typing:stop with debounce
  const emitTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket?.connected || !matchId) return;

    if (!isTypingEmittedRef.current) {
      socket.emit('typing:start', { matchId });
      isTypingEmittedRef.current = true;
    }

    // Reset debounce timer
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = setTimeout(() => {
      const s = getSocket();
      if (s?.connected) {
        s.emit('typing:stop', { matchId });
      }
      isTypingEmittedRef.current = false;
    }, TYPING_DEBOUNCE_MS);
  }, [matchId]);

  const stopTypingEmit = useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (isTypingEmittedRef.current) {
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit('typing:stop', { matchId });
      }
      isTypingEmittedRef.current = false;
    }
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return undefined;

    let cancelled = false;
    let sseDisconnect: (() => void) | null = null;

    const stopPolling = () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const startPolling = () => {
      if (!pollTimerRef.current) {
        pollTimerRef.current = setInterval(() => {
          void refetchRef.current();
        }, 5000);
      }
    };

    const fallbackToSSE = async () => {
      if (cancelled) return;
      setConnectionStatus('disconnected');

      sseDisconnect = await connectMatchMessageStream(matchId, {
        onStatus: (status) => {
          if (cancelled) return;
          if (status === 'connected') {
            setConnectionStatus('connected');
            stopPolling();
          } else if (status === 'connecting') {
            setConnectionStatus('connecting');
          } else {
            setConnectionStatus('disconnected');
            startPolling();
          }
        },
        onMessage: () => {
          void refetchRef.current();
        },
        onError: () => {
          if (cancelled) return;
          setConnectionStatus('disconnected');
          startPolling();
        },
      });
    };

    const setupWebSocket = async () => {
      try {
        setConnectionStatus('connecting');
        const socket = await connectSocket();
        if (cancelled) return;

        socket.on('connect', () => {
          if (cancelled) return;
          setConnectionStatus('connected');
          stopPolling();
          socket.emit('join:match', { matchId });
        });

        socket.on('disconnect', () => {
          if (cancelled) return;
          setConnectionStatus('reconnecting');
          startPolling();
        });

        socket.on('reconnect', () => {
          if (cancelled) return;
          setConnectionStatus('connected');
          stopPolling();
          socket.emit('join:match', { matchId });
          void refetchRef.current();
        });

        socket.on('message:new', (data: { matchId: string; message: ChatMessage }) => {
          if (data.matchId !== matchId) return;
          setIsTyping(false);
          void refetchRef.current();
        });

        socket.on('typing:start', (data: { matchId: string; userId: string }) => {
          if (data.matchId !== matchId) return;
          setIsTyping(true);
        });

        socket.on('typing:stop', (data: { matchId: string; userId: string }) => {
          if (data.matchId !== matchId) return;
          setIsTyping(false);
        });

        socket.on('connect_error', () => {
          if (cancelled) return;
          // WebSocket failed to connect, fall back to SSE + polling
          socket.off();
          void fallbackToSSE();
        });

        // If already connected, join immediately
        if (socket.connected) {
          setConnectionStatus('connected');
          socket.emit('join:match', { matchId });
        }
      } catch {
        // WebSocket setup failed, fall back to SSE + polling
        if (!cancelled) {
          void fallbackToSSE();
        }
      }
    };

    // Start polling immediately as a safety net
    startPolling();
    void setupWebSocket();

    return () => {
      cancelled = true;
      stopPolling();

      // Leave room and clean up socket listeners
      const socket = getSocket();
      if (socket) {
        socket.emit('leave:match', { matchId });
        socket.off('connect');
        socket.off('disconnect');
        socket.off('reconnect');
        socket.off('message:new');
        socket.off('typing:start');
        socket.off('typing:stop');
        socket.off('connect_error');
      }

      sseDisconnect?.();

      // Clear typing timer
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    };
  }, [matchId]);

  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      stopTypingEmit();
      return (await matchesApi.sendMessage(matchId, text)).data;
    },
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: messageKey });
      const previous = queryClient.getQueryData<ChatMessage[]>(messageKey) || [];
      const tempId = `temp-${Date.now()}`;
      const tempMessage: ChatMessage = {
        id: tempId,
        text,
        sender: 'me',
        timestamp: new Date().toISOString(),
      };

      queryClient.setQueryData<ChatMessage[]>(messageKey, [tempMessage, ...previous]);

      return { previous, tempId };
    },
    onError: (_error, _text, context) => {
      if (context?.previous) {
        queryClient.setQueryData(messageKey, context.previous);
      }
    },
    onSuccess: (message, _text, context) => {
      queryClient.setQueryData<ChatMessage[]>(messageKey, (current = []) =>
        current.map((item) => (item.id === context?.tempId ? message : item)),
      );
    },
    onSettled: () => {
      void query.refetch();
    },
  });

  return useMemo(
    () => ({
      messages: query.data || [],
      loading: query.isLoading,
      refreshing: query.isRefetching && !query.isLoading,
      error: query.error,
      connectionStatus,
      isTyping,
      refresh,
      sendMessage: sendMessage.mutateAsync,
      sending: sendMessage.isPending,
      emitTyping,
    }),
    [
      connectionStatus,
      isTyping,
      query.data,
      query.error,
      query.isLoading,
      query.isRefetching,
      refresh,
      sendMessage.isPending,
      sendMessage.mutateAsync,
      emitTyping,
    ],
  );
}
