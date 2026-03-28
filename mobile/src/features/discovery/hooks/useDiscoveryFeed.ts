import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  LikeResponse,
  UndoSwipeResponse,
} from '../../../api/types';
import {
  discoveryApi,
  type DiscoveryFiltersInput,
} from '../../../services/api';
import {
  removeUserFromDiscoveryFeedFamily,
  restoreDiscoveryFeedFamily,
} from '../../../lib/query/discoveryFeedCache';
import { queryKeys } from '../../../lib/query/queryKeys';
import { invalidateQueryScopes, queryInvalidationScopes } from '../../../lib/query/queryInvalidation';

function createFeedKey(filters?: DiscoveryFiltersInput) {
  return queryKeys.discovery.feed(filters ?? {});
}

export function useDiscoveryFeed(filters?: DiscoveryFiltersInput) {
  const queryClient = useQueryClient();
  const feedKey = createFeedKey(filters);

  const query = useQuery({
    queryKey: feedKey,
    queryFn: async () => (await discoveryApi.feed(filters)).data || [],
  });

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
    onSuccess: (data) => {
      if (data.status === 'match') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.matches.list() });
      }
    },
    onError: (_error, _userId, context) => {
      restoreDiscoveryFeedFamily(queryClient, context?.previousFeeds);
    },
  });

  const undo = useMutation({
    mutationFn: async () => (await discoveryApi.undo()).data as UndoSwipeResponse,
    onSuccess: () => {
      void invalidateQueryScopes(queryClient, queryInvalidationScopes.discoveryAction);
    },
  });

  return {
    ...query,
    feed: query.data || [],
    likeUser: like.mutateAsync,
    passUser: pass.mutateAsync,
    undoSwipe: undo.mutateAsync,
    isActing: like.isPending || pass.isPending || undo.isPending,
  };
}
