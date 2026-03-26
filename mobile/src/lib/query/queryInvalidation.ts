import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type QueryInvalidationScope = {
  queryKey: QueryKey;
  refetchType?: 'active' | 'all' | 'inactive' | 'none';
};

export const queryInvalidationScopes = {
  discoveryAction: [
    { queryKey: queryKeys.discovery.feeds() },
    { queryKey: queryKeys.matches.list() },
  ],
  eventWrite: [
    { queryKey: queryKeys.events.all(), refetchType: 'inactive' as const },
  ],
  profileWrite: [
    { queryKey: queryKeys.profile.all(), refetchType: 'active' as const },
    { queryKey: queryKeys.discovery.all() },
    { queryKey: queryKeys.matches.list() },
  ],
} satisfies Record<string, readonly QueryInvalidationScope[]>;

export async function invalidateQueryScopes(
  queryClient: QueryClient,
  scopes: readonly QueryInvalidationScope[],
) {
  await Promise.all(
    scopes.map(({ queryKey, refetchType }) =>
      queryClient.invalidateQueries({ queryKey, refetchType }),
    ),
  );
}

async function invalidateQueryKeys(
  queryClient: QueryClient,
  queryKeySet: readonly QueryKey[],
) {
  await Promise.all(
    queryKeySet.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}

export function invalidateProfileSurfaces(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.profile.all(),
      refetchType: 'inactive',
    }),
    queryClient.invalidateQueries({ queryKey: queryKeys.discovery.profileCompleteness() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.discovery.feeds() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.matches.list() }),
  ]);
}

export function invalidateDiscoverySurfaces(queryClient: QueryClient) {
  return invalidateQueryKeys(queryClient, [
    queryKeys.discovery.feeds(),
    queryKeys.matches.list(),
  ]);
}

export function invalidateEventSurfaces(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.events.all(),
    refetchType: 'inactive',
  });
}
