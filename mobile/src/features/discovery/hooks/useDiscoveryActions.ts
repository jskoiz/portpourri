import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LikeResponse } from '../../../api/types';
import { discoveryApi } from '../../../services/api';
import {
  removeUserFromDiscoveryFeedFamily,
  restoreDiscoveryFeedFamily,
} from '../../../lib/query/discoveryFeedCache';
import { queryKeys } from '../../../lib/query/queryKeys';

/**
 * Standalone discovery actions (pass/like) for use outside the feed context,
 * e.g. ProfileDetailScreen where we still want discovery caches to stay in sync.
 */
export function useDiscoveryActions() {
  const queryClient = useQueryClient();

  const pass = useMutation({
    mutationFn: async (userId: string) => discoveryApi.pass(userId),
    onMutate: async (userId) => ({
      previousFeeds: await removeUserFromDiscoveryFeedFamily(queryClient, userId),
    }),
    onError: (_error, _userId, context) => {
      restoreDiscoveryFeedFamily(queryClient, context?.previousFeeds);
    },
  });

  const like = useMutation({
    mutationFn: async (userId: string) =>
      (await discoveryApi.like(userId)).data as LikeResponse,
    onMutate: async (userId) => ({
      previousFeeds: await removeUserFromDiscoveryFeedFamily(queryClient, userId),
    }),
    onSuccess: (response) => {
      if (response.status === 'match') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.matches.list() });
      }
    },
    onError: (_error, _userId, context) => {
      restoreDiscoveryFeedFamily(queryClient, context?.previousFeeds);
    },
  });

  return {
    passUser: pass.mutateAsync,
    likeUser: like.mutateAsync,
    isActing: pass.isPending || like.isPending,
  };
}
