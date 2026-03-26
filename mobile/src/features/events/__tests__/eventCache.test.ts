import { createTestQueryClient } from '../../../lib/testing/queryTestHarness';
import { queryKeys } from '../../../lib/query/queryKeys';
import type { EventSummary } from '../../../api/types';
import {
  patchJoinedEventSummaryCaches,
  upsertEventSummaryCaches,
  upsertJoinedEventSummaryCaches,
} from '../eventCache';

function makeEvent(overrides: Partial<EventSummary> = {}): EventSummary {
  return {
    id: overrides.id ?? 'event-1',
    title: overrides.title ?? 'Sunrise run',
    description: overrides.description ?? null,
    location: overrides.location ?? 'Magic Island',
    imageUrl: overrides.imageUrl ?? null,
    category: overrides.category ?? 'Run',
    startsAt: overrides.startsAt ?? '2026-03-15T16:00:00.000Z',
    endsAt: overrides.endsAt ?? '2026-03-15T17:00:00.000Z',
    host: overrides.host ?? { id: 'host-1', firstName: 'Nia' },
    attendeesCount: overrides.attendeesCount ?? 5,
    joined: overrides.joined ?? false,
  };
}

describe('eventCache', () => {
  it('upserts created events into list, mine, and detail caches', () => {
    const queryClient = createTestQueryClient();
    const existingEvent = makeEvent({ id: 'event-old', title: 'Old hike' });
    const createdEvent = makeEvent({ id: 'event-new', title: 'New trail session' });

    queryClient.setQueryData(queryKeys.events.list(), [existingEvent]);
    queryClient.setQueryData(queryKeys.events.mine(), [existingEvent]);

    upsertEventSummaryCaches(queryClient, createdEvent);

    expect(queryClient.getQueryData(queryKeys.events.detail('event-new'))).toEqual(createdEvent);
    expect(queryClient.getQueryData<EventSummary[]>(queryKeys.events.list())).toEqual([
      createdEvent,
      existingEvent,
    ]);
    expect(queryClient.getQueryData<EventSummary[]>(queryKeys.events.mine())).toEqual([
      createdEvent,
      existingEvent,
    ]);
  });

  it('updates joined state across existing event caches', () => {
    const queryClient = createTestQueryClient();
    const event = makeEvent({ id: 'event-1', attendeesCount: 4 });
    const otherEvent = makeEvent({ id: 'event-2', title: 'Other event' });

    queryClient.setQueryData(queryKeys.events.detail(event.id), event);
    queryClient.setQueryData(queryKeys.events.list(), [event, otherEvent]);
    queryClient.setQueryData(queryKeys.events.mine(), [otherEvent, event]);

    patchJoinedEventSummaryCaches(queryClient, event.id, 8);

    expect(queryClient.getQueryData(queryKeys.events.detail(event.id))).toEqual({
      ...event,
      joined: true,
      attendeesCount: 8,
    });
    expect(queryClient.getQueryData<EventSummary[]>(queryKeys.events.list())).toEqual([
      { ...event, joined: true, attendeesCount: 8 },
      otherEvent,
    ]);
    expect(queryClient.getQueryData<EventSummary[]>(queryKeys.events.mine())).toEqual([
      otherEvent,
      { ...event, joined: true, attendeesCount: 8 },
    ]);
  });

  it('promotes joined events into every event cache when the full event is known', () => {
    const queryClient = createTestQueryClient();
    const joinedEvent = makeEvent({ id: 'event-3', attendeesCount: 9 });

    upsertJoinedEventSummaryCaches(queryClient, joinedEvent, 10);

    expect(queryClient.getQueryData(queryKeys.events.detail('event-3'))).toEqual({
      ...joinedEvent,
      joined: true,
      attendeesCount: 10,
    });
    expect(queryClient.getQueryData<EventSummary[]>(queryKeys.events.list())).toEqual([
      { ...joinedEvent, joined: true, attendeesCount: 10 },
    ]);
    expect(queryClient.getQueryData<EventSummary[]>(queryKeys.events.mine())).toEqual([
      { ...joinedEvent, joined: true, attendeesCount: 10 },
    ]);
  });
});
