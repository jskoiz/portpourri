import type { Match } from '../../../api/types';
import { useQuery } from '@tanstack/react-query';
import { matchesApi } from '../../../services/api';
import { queryKeys } from '../../../lib/query/queryKeys';
import { filterBlockedMatches } from '../../../lib/moderation/blockedUsers';

export function useMatches() {
  const query = useQuery({
    queryKey: queryKeys.matches.list(),
    queryFn: async () =>
      (await matchesApi.list() as { data: Match[] | null }).data || [],
    staleTime: 60_000,
    select: filterBlockedMatches,
  });

  return {
    ...query,
    matches: query.data || [],
  };
}
