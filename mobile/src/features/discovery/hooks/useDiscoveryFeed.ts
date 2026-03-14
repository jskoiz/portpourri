import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  LikeResponse,
  UndoSwipeResponse,
  User,
} from '../../../api/types';
import {
  discoveryApi,
  type DiscoveryFiltersInput,
} from '../../../services/api';
import { queryKeys } from '../../../lib/query/queryKeys';

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

  const removeFromFeed = async (userId: string) => {
    const previous = queryClient.getQueryData<User[]>(feedKey) || [];
    queryClient.setQueryData<User[]>(
      feedKey,
      previous.filter((item) => item.id !== userId),
    );
    return previous;
  };

  const pass = useMutation({
    mutationFn: async (userId: string) => discoveryApi.pass(userId),
    onMutate: removeFromFeed,
    onError: (_error, _userId, previous) => {
      if (previous) {
        queryClient.setQueryData(feedKey, previous);
      }
    },
  });

  const like = useMutation({
    mutationFn: async (userId: string) =>
      (await discoveryApi.like(userId)).data as LikeResponse,
    onMutate: removeFromFeed,
    onError: (_error, _userId, previous) => {
      if (previous) {
        queryClient.setQueryData(feedKey, previous);
      }
    },
  });

  const undo = useMutation({
    mutationFn: async () => (await discoveryApi.undo()).data as UndoSwipeResponse,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['discovery', 'feed'] });
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
