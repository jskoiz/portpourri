import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../../../services/api';
import { queryKeys } from '../../../lib/query/queryKeys';

export function useExploreEvents() {
  const query = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: async () => (await eventsApi.list()).data || [],
  });

  return {
    ...query,
    events: query.data || [],
  };
}
