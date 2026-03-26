import { useQuery } from '@tanstack/react-query';
import type { EventSummary } from '../../../api/types';
import { eventsApi } from '../../../services/api';
import { queryKeys } from '../../../lib/query/queryKeys';

const EMPTY_EVENTS: EventSummary[] = [];

export function useExploreEvents() {
  const query = useQuery({
    queryKey: queryKeys.events.list(),
    queryFn: async () =>
      (await eventsApi.list() as { data: EventSummary[] | null }).data || [],
    staleTime: 60_000,
  });

  return {
    ...query,
    events: query.data ?? EMPTY_EVENTS,
  };
}
