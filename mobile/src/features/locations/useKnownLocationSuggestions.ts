import { useQuery } from '@tanstack/react-query';
import type { EventSummary } from '../../api/types';
import { queryKeys } from '../../lib/query/queryKeys';
import { extractKnownLocationSuggestions } from './locationSuggestions';

export function useKnownLocationSuggestions() {
  const eventsList = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => [] as EventSummary[],
    enabled: false,
  });

  const mine = useQuery({
    queryKey: queryKeys.events.mine,
    queryFn: () => [] as EventSummary[],
    enabled: false,
  });

  const allEvents = [...(eventsList.data ?? []), ...(mine.data ?? [])];
  return extractKnownLocationSuggestions(allEvents);
}
