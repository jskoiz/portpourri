import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatMessage } from '../../../api/types';
import { matchesApi } from '../../../services/api';
import { connectMatchMessageStream } from '../../../services/matchRealtime';
import { queryKeys } from '../../../lib/query/queryKeys';

type ConnectionStatus = 'connecting' | 'connected' | 'fallback';

export function useChatThread(matchId: string) {
  const queryClient = useQueryClient();
  const messageKey = queryKeys.matches.messages(matchId);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('fallback');

  const query = useQuery({
    enabled: Boolean(matchId),
    queryKey: messageKey,
    queryFn: async () => (await matchesApi.getMessages(matchId)).data || [],
  });

  const refetchRef = useRef(query.refetch);
  refetchRef.current = query.refetch;

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  useEffect(() => {
    if (!matchId) {
      return undefined;
    }

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

    let disconnect: () => void = () => {};

    const setupRealtime = async () => {
      disconnect = await connectMatchMessageStream(matchId, {
        onStatus: (status) => {
          setConnectionStatus(status);
          if (status === 'connected') {
            stopPolling();
          } else {
            startPolling();
          }
        },
        onMessage: () => {
          void refetchRef.current();
        },
        onError: () => {
          setConnectionStatus('fallback');
          startPolling();
        },
      });
    };

    void setupRealtime();
    startPolling();

    return () => {
      disconnect();
      stopPolling();
    };
  }, [matchId]);

  const sendMessage = useMutation({
    mutationFn: async (text: string) => (await matchesApi.sendMessage(matchId, text)).data,
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
      refresh,
      sendMessage: sendMessage.mutateAsync,
      sending: sendMessage.isPending,
    }),
    [
      connectionStatus,
      query.data,
      query.error,
      query.isLoading,
      query.isRefetching,
      refresh,
      sendMessage.isPending,
      sendMessage.mutateAsync,
    ],
  );
}
