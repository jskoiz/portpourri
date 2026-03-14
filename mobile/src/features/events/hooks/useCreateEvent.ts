import { useMutation, useQueryClient } from '@tanstack/react-query';
import { normalizeApiError } from '../../../api/errors';
import type { CreateEventPayload, EventSummary } from '../../../api/types';
import { queryKeys } from '../../../lib/query/queryKeys';
import { eventsApi } from '../../../services/api';

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const createEvent = useMutation({
    mutationFn: async (payload: CreateEventPayload) => (await eventsApi.create(payload)).data,
    onSuccess: (createdEvent: EventSummary) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.list });
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.mine });
      queryClient.setQueryData<EventSummary[]>(queryKeys.events.list, (current = []) => [
        createdEvent,
        ...current,
      ]);
    },
  });

  return {
    createEvent: createEvent.mutateAsync,
    createdEvent: createEvent.data ?? null,
    createError: createEvent.error ? normalizeApiError(createEvent.error).message : null,
    isCreating: createEvent.isPending,
    reset: createEvent.reset,
  };
}

