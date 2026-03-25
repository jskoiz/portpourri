import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatMessage } from '../../../api/types';
import { matchesApi } from '../../../services/api';
import { connectMatchMessageStream } from '../../../services/matchRealtime';
import { queryKeys } from '../../../lib/query/queryKeys';
import { connectSocket, getSocket } from '../../../lib/socket';

type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

const TYPING_DEBOUNCE_MS = 2000;

export function useChatThread(matchId: string) {
  const queryClient = useQueryClient();
  const messageKey = queryKeys.matches.messages(matchId);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketHandlersRef = useRef<{
    connect?: () => void;
    disconnect?: () => void;
    reconnect?: () => void;
    messageNew?: (data: { matchId: string; message: ChatMessage }) => void;
    typingStart?: (data: { matchId: string; userId: string }) => void;
    typingStop?: (data: { matchId: string; userId: string }) => void;
    connectError?: () => void;
  }>({});
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

        const handleConnect = () => {
          if (cancelled) return;
          setConnectionStatus('connected');
          stopPolling();
          socket.emit('join:match', { matchId });
        };

        const handleDisconnect = () => {
          if (cancelled) return;
          setConnectionStatus('reconnecting');
          startPolling();
        };

        const handleReconnect = () => {
          if (cancelled) return;
          setConnectionStatus('connected');
          stopPolling();
          socket.emit('join:match', { matchId });
          void refetchRef.current();
        };

        const handleMessageNew = (data: { matchId: string; message: ChatMessage }) => {
          if (data.matchId !== matchId) return;
          setIsTyping(false);
          void refetchRef.current();
        };

        const handleTypingStart = (data: { matchId: string; userId: string }) => {
          if (data.matchId !== matchId) return;
          setIsTyping(true);
        };

        const handleTypingStop = (data: { matchId: string; userId: string }) => {
          if (data.matchId !== matchId) return;
          setIsTyping(false);
        };

        const handleConnectError = () => {
          if (cancelled) return;
          // WebSocket failed to connect, fall back to SSE + polling
          socket.off('connect', handleConnect);
          socket.off('disconnect', handleDisconnect);
          socket.off('reconnect', handleReconnect);
          socket.off('message:new', handleMessageNew);
          socket.off('typing:start', handleTypingStart);
          socket.off('typing:stop', handleTypingStop);
          socket.off('connect_error', handleConnectError);
          void fallbackToSSE();
        };

        socketHandlersRef.current = {
          connect: handleConnect,
          disconnect: handleDisconnect,
          reconnect: handleReconnect,
          messageNew: handleMessageNew,
          typingStart: handleTypingStart,
          typingStop: handleTypingStop,
          connectError: handleConnectError,
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('reconnect', handleReconnect);
        socket.on('message:new', handleMessageNew);
        socket.on('typing:start', handleTypingStart);
        socket.on('typing:stop', handleTypingStop);
        socket.on('connect_error', handleConnectError);

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
      stopTypingEmit();

      // Leave room and clean up socket listeners
      const socket = getSocket();
      if (socket) {
        socket.emit('leave:match', { matchId });
        const handlers = socketHandlersRef.current;
        if (handlers.connect) socket.off('connect', handlers.connect);
        if (handlers.disconnect) socket.off('disconnect', handlers.disconnect);
        if (handlers.reconnect) socket.off('reconnect', handlers.reconnect);
        if (handlers.messageNew) socket.off('message:new', handlers.messageNew);
        if (handlers.typingStart) socket.off('typing:start', handlers.typingStart);
        if (handlers.typingStop) socket.off('typing:stop', handlers.typingStop);
        if (handlers.connectError) socket.off('connect_error', handlers.connectError);
      }
      socketHandlersRef.current = {};

      sseDisconnect?.();
    };
  }, [matchId, stopTypingEmit]);

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
