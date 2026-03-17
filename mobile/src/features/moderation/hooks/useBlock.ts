import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import type { BlockPayload, BlockResponse } from '../../../api/types';
import { moderationApi } from '../../../services/api';
import { queryKeys } from '../../../lib/query/queryKeys';

export function useBlock(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: BlockPayload) =>
      (await moderationApi.block(payload)).data as BlockResponse,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.matches.list });
      Alert.alert('User blocked', 'They will no longer be able to see your profile or message you.');
      options?.onSuccess?.();
    },
    onError: () => {
      Alert.alert(
        'Could not block user',
        'Something went wrong. Please try again later.',
      );
    },
  });

  return {
    block: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}
