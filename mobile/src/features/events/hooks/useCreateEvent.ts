import { useMutation, useQueryClient } from '@tanstack/react-query';
import { normalizeApiError } from '../../../api/errors';
import type { CreateEventPayload, EventSummary } from '../../../api/types';
import { prependCreatedEvent } from '../../../lib/query/queryData';
import { invalidateQueryScopes, queryInvalidationScopes } from '../../../lib/query/queryInvalidation';
import { eventsApi } from '../../../services/api';
import { upsertEventSummaryCaches } from '../eventCache';

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const createEvent = useMutation({
    mutationFn: async (payload: CreateEventPayload) =>
      (await eventsApi.create(payload) as { data: EventSummary }).data,
    onSuccess: (createdEvent: EventSummary) => {
      upsertEventSummaryCaches(queryClient, createdEvent);
      prependCreatedEvent(queryClient, createdEvent);
      void invalidateQueryScopes(queryClient, queryInvalidationScopes.eventWrite);
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
