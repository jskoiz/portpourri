import { useMutation } from '@tanstack/react-query';
import type { LikeResponse } from '../../../api/types';
import { discoveryApi } from '../../../services/api';

/**
 * Standalone discovery actions (pass/like) for use outside the feed context,
 * e.g. ProfileDetailScreen where we don't need feed-level optimistic updates.
 */
export function useDiscoveryActions() {
  const pass = useMutation({
    mutationFn: async (userId: string) => discoveryApi.pass(userId),
  });

  const like = useMutation({
    mutationFn: async (userId: string) =>
      (await discoveryApi.like(userId)).data as LikeResponse,
  });

  return {
    passUser: pass.mutateAsync,
    likeUser: like.mutateAsync,
    isActing: pass.isPending || like.isPending,
  };
}
