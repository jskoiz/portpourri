import { useQuery } from '@tanstack/react-query';
import { discoveryApi } from '../../../services/api';
import { queryKeys } from '../../../lib/query/queryKeys';

export function useProfileCompleteness() {
  const query = useQuery({
    queryKey: queryKeys.discovery.profileCompleteness,
    queryFn: async () => (await discoveryApi.profileCompleteness()).data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    ...query,
    score: query.data?.score ?? 0,
    total: query.data?.total ?? 0,
    earned: query.data?.earned ?? 0,
    missing: query.data?.missing ?? [],
  };
}
