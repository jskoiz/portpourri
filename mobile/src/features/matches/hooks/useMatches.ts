import { useQuery } from '@tanstack/react-query';
import { matchesApi } from '../../../services/api';
import { queryKeys } from '../../../lib/query/queryKeys';

export function useMatches() {
  const query = useQuery({
    queryKey: queryKeys.matches.list,
    queryFn: async () => (await matchesApi.list()).data || [],
  });

  return {
    ...query,
    matches: query.data || [],
  };
}
