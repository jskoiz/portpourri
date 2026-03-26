import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatMessage } from '../../../api/types';
import { matchesApi } from '../../../services/api';
import { connectMatchMessageStream } from '../../../services/matchRealtime';
import { beginOptimisticUpdate } from '../../../lib/query/optimisticUpdates';
import { queryKeys } from '../../../lib/query/queryKeys';
import { connectSocket, getSocket } from '../../../lib/socket';

type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

const TYPING_DEBOUNCE_MS = 2000;

function reconcileMessageList(
  current: ChatMessage[] | undefined,
  serverMessage: ChatMessage,
  tempId?: string,
) {
  const messages = current ?? [];

  let next = messages;

  if (tempId && messages.some((message) => message.id === tempId)) {
    next = messages.map((message) =>
      message.id === tempId ? serverMessage : message,
    );
  } else if (!messages.some((message) => message.id === serverMessage.id)) {
    next = [serverMessage, ...messages];
  }

  const seen = new Set<string>();
  return next.filter((message) => {
    if (seen.has(message.id)) {
      return false;
    }

    seen.add(message.id);
    return true;
  });
}

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
    queryFn: async () =>
      (await matchesApi.getMessages(matchId) as { data: ChatMessage[] | null }).data || [],
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

      const nextDisconnect = await connectMatchMessageStream(matchId, {
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
      if (cancelled) {
        nextDisconnect();
        return;
      }

      sseDisconnect = nextDisconnect;
    };

    const setupWebSocket = async () => {
      try {
        setConnectionStatus('connecting');
        const socket = await connectSocket();
        if (cancelled) {
          socket.disconnect();
          return;
        }

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
          queryClient.setQueryData<ChatMessage[]>(
            messageKey,
            (current) => reconcileMessageList(current, data.message),
          );
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
          stopPolling();
          socket.emit('join:match', { matchId });
        }
      } catch {
        // WebSocket setup failed, fall back to SSE + polling
        if (!cancelled) {
          void fallbackToSSE();
        }
      }
    };

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
      return (await matchesApi.sendMessage(matchId, text) as { data: ChatMessage }).data;
    },
    onMutate: async (text) => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const tempMessage: ChatMessage = {
        id: tempId,
        text,
        sender: 'me',
        timestamp: new Date().toISOString(),
      };

      const optimistic = await beginOptimisticUpdate(queryClient, [
        {
          queryKey: messageKey,
          exact: true,
          updater: (current) => [
            tempMessage,
            ...(Array.isArray(current) ? (current as ChatMessage[]) : []),
          ],
        },
      ]);

      return { rollback: optimistic.rollback, tempId };
    },
    onError: (_error, _text, context) => {
      context?.rollback?.();
    },
    onSuccess: (message, _text, context) => {
      queryClient.setQueryData<ChatMessage[]>(messageKey, (current) =>
        reconcileMessageList(current, message, context?.tempId),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: messageKey,
        refetchType: 'inactive',
      });
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
