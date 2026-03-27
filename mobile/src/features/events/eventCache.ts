import type { QueryClient } from '@tanstack/react-query';
import type { EventDetail, EventSummary } from '../../api/types';
import { queryKeys } from '../../lib/query/queryKeys';

function upsertEventInCollection(
  current: EventSummary[] | undefined,
  nextEvent: EventSummary,
) {
  if (!current) {
    return [nextEvent];
  }

  const nextIndex = current.findIndex((event) => event.id === nextEvent.id);
  if (nextIndex === -1) {
    return [nextEvent, ...current];
  }

  return current.map((event) => (event.id === nextEvent.id ? nextEvent : event));
}

function patchEventInCollection(
  current: EventSummary[] | undefined,
  eventId: string,
  nextEvent: EventSummary,
) {
  if (!current) {
    return current;
  }

  let patched = false;
  const next = current.map((event) => {
    if (event.id !== eventId) {
      return event;
    }

    patched = true;
    return nextEvent;
  });

  return patched ? next : current;
}

export function getKnownEvent(
  queryClient: QueryClient,
  eventId: string,
): EventSummary | EventDetail | undefined {
  return (
    queryClient.getQueryData<EventDetail>(queryKeys.events.detail(eventId)) ??
    queryClient
      .getQueryData<EventSummary[]>(queryKeys.events.list())
      ?.find((event) => event.id === eventId) ??
    queryClient
      .getQueryData<EventSummary[]>(queryKeys.events.mine())
      ?.find((event) => event.id === eventId)
  );
}

export function upsertEventSummaryCaches(
  queryClient: QueryClient,
  event: EventSummary,
) {
  queryClient.setQueryData<EventDetail>(queryKeys.events.detail(event.id), {
    ...event,
    attendees: [],
  });
  queryClient.setQueryData<EventSummary[]>(
    queryKeys.events.list(),
    (current = []) => upsertEventInCollection(current, event),
  );
  queryClient.setQueryData<EventSummary[]>(
    queryKeys.events.mine(),
    (current = []) => upsertEventInCollection(current, event),
  );
}

export function upsertJoinedEventSummaryCaches(
  queryClient: QueryClient,
  event: EventSummary,
  attendeesCount: number,
) {
  upsertEventSummaryCaches(queryClient, {
    ...event,
    joined: true,
    attendeesCount,
  });
}

export function patchJoinedEventSummaryCaches(
  queryClient: QueryClient,
  eventId: string,
  attendeesCount: number,
) {
  const patchCollection = (current: EventSummary[] | undefined) => {
    const existing = current?.find((event) => event.id === eventId);
    if (!existing) {
      return current;
    }

    return patchEventInCollection(current, eventId, {
      ...existing,
      joined: true,
      attendeesCount,
    });
  };

  queryClient.setQueryData<EventDetail | undefined>(
    queryKeys.events.detail(eventId),
    (current) =>
      current
        ? {
            ...current,
            joined: true,
            attendeesCount,
            attendees: current.attendees ?? [],
          }
        : current,
  );
  queryClient.setQueryData<EventSummary[]>(queryKeys.events.list(), patchCollection);
  queryClient.setQueryData<EventSummary[]>(queryKeys.events.mine(), (current) => {
    const patched = patchCollection(current);
    if (patched !== current) {
      return patched;
    }

    const existing = getKnownEvent(queryClient, eventId);
    if (!existing) {
      return current;
    }

    return upsertEventInCollection(current, {
      ...existing,
      joined: true,
      attendeesCount,
    });
  });
}
