import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

async function invalidateQueryKeys(
  queryClient: QueryClient,
  queryKeySet: readonly QueryKey[],
) {
  await Promise.all(
    queryKeySet.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}

export function invalidateProfileSurfaces(queryClient: QueryClient) {
  return invalidateQueryKeys(queryClient, [
    queryKeys.profile.family,
    queryKeys.discovery.feedFamily,
    queryKeys.matches.list,
  ]);
}

export function invalidateDiscoverySurfaces(queryClient: QueryClient) {
  return invalidateQueryKeys(queryClient, [
    queryKeys.discovery.feedFamily,
    queryKeys.matches.list,
  ]);
}

export function invalidateEventSurfaces(queryClient: QueryClient) {
  // Event mutations often patch the currently viewed detail cache directly first.
  // Keep the family invalidated without immediately refetching the active detail query.
  return queryClient.invalidateQueries({
    queryKey: queryKeys.events.family,
    refetchType: 'inactive',
  });
}
