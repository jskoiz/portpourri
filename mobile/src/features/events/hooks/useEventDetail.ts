import type { QueryKey } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EventDetail, EventRsvpResponse, EventSummary } from '../../../api/types';
import { beginOptimisticUpdate } from '../../../lib/query/optimisticUpdates';
import { invalidateQueryScopes, queryInvalidationScopes } from '../../../lib/query/queryInvalidation';
import { markEventJoined } from '../../../lib/query/queryData';
import { eventsApi } from '../../../services/api';
import { queryKeys } from '../../../lib/query/queryKeys';
import { showToast } from '../../../store/toastStore';
import { patchJoinedEventSummaryCaches } from '../eventCache';

function applyRsvpPatch(
  current: unknown,
  queryKey: QueryKey,
  eventId: string,
  attendeesCount?: number,
) {
  const [family, scope] = queryKey as readonly [string?, string?];

  if (family !== 'events') {
    return current;
  }

  if (scope === 'detail') {
    const event = current as EventDetail | undefined;
    if (!event || event.id !== eventId || event.joined) {
      return current;
    }

    return {
      ...event,
      joined: true,
      attendeesCount: attendeesCount ?? event.attendeesCount + 1,
    };
  }

  if (scope === 'list' || scope === 'mine') {
    const events = current as EventSummary[] | undefined;
    if (!Array.isArray(events)) {
      return current;
    }

    return events.map((event) =>
      event.id === eventId && !event.joined
        ? {
            ...event,
            joined: true,
            attendeesCount: attendeesCount ?? event.attendeesCount + 1,
          }
        : event,
    );
  }

  return current;
}

export function useJoinEvent(
  eventId: string,
  options?: {
    onSuccess?: (result: EventRsvpResponse) => void;
  },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () =>
      (await eventsApi.rsvp(eventId) as { data: EventRsvpResponse }).data,
    onMutate: async () => {
      const optimisticUpdate = await beginOptimisticUpdate(queryClient, [
        {
          queryKey: queryKeys.events.all(),
          updater: (current, queryKey) => applyRsvpPatch(current, queryKey, eventId),
        },
      ]);

      return optimisticUpdate;
    },
    onError: (_error, _variables, context) => {
      context?.rollback();
    },
    onSuccess: (result) => {
      markEventJoined(queryClient, eventId, result.attendeesCount);
      patchJoinedEventSummaryCaches(queryClient, eventId, result.attendeesCount);
      void invalidateQueryScopes(queryClient, queryInvalidationScopes.eventWrite);
      options?.onSuccess?.(result);
    },
  });
}

export function useEventDetail(eventId: string) {
  const query = useQuery({
    enabled: Boolean(eventId),
    queryKey: queryKeys.events.detail(eventId),
    queryFn: async () =>
      (await eventsApi.detail(eventId) as { data: EventDetail }).data,
  });

  const rsvp = useJoinEvent(eventId, {
    onSuccess: () => {
      showToast('RSVP confirmed!', 'success');
    },
  });

  return {
    ...query,
    event: query.data ?? null,
    joinEvent: rsvp.mutateAsync,
    isJoining: rsvp.isPending,
  };
}
