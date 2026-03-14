import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../../../services/api';
import { queryKeys } from '../../../lib/query/queryKeys';

export function useMyEvents() {
  const query = useQuery({
    queryKey: queryKeys.events.mine,
    queryFn: async () => (await eventsApi.mine()).data || [],
  });

  return {
    ...query,
    events: query.data || [],
  };
}
