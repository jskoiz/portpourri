import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../../../services/api';
import type { EventDetail } from '../../../api/types';
import { queryKeys } from '../../../lib/query/queryKeys';
import { invalidateEventSurfaces } from '../../../lib/query/queryInvalidation';
import { showToast } from '../../../store/toastStore';

export function useEventDetail(eventId: string) {
  const queryClient = useQueryClient();
  const detailKey = queryKeys.events.detail(eventId);

  const query = useQuery({
    enabled: Boolean(eventId),
    queryKey: detailKey,
    queryFn: async () => (await eventsApi.detail(eventId)).data,
  });

  const rsvp = useMutation({
    mutationFn: async () => (await eventsApi.rsvp(eventId)).data,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<EventDetail>(detailKey);

      if (previous && !previous.joined) {
        queryClient.setQueryData<EventDetail>(detailKey, {
          ...previous,
          joined: true,
          attendeesCount: previous.attendeesCount + 1,
        });
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(detailKey, context.previous);
      }
    },
    onSuccess: (result) => {
      queryClient.setQueryData<EventDetail>(detailKey, (current) =>
        current
          ? { ...current, joined: true, attendeesCount: result.attendeesCount }
          : undefined,
      );
      void invalidateEventSurfaces(queryClient);
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
