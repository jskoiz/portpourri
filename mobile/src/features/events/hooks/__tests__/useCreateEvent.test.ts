import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { EventSummary } from '../../../../api/types';
import { createQueryTestHarness } from '../../../../lib/testing/queryTestHarness';
import { useCreateEvent } from '../useCreateEvent';

const mockCreate = jest.fn();

jest.mock('../../../../services/api', () => ({
  eventsApi: {
    create: (...args: unknown[]) => mockCreate(...args),
  },
}));

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
    attendeesCount: overrides.attendeesCount ?? 1,
    joined: overrides.joined ?? true,
  };
}

describe('useCreateEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('upserts the created event into every event cache', async () => {
    const createdEvent = makeEvent({ id: 'event-new', title: 'New event' });
    mockCreate.mockResolvedValue({ data: createdEvent });

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useCreateEvent(), { wrapper });

    await act(async () => {
      await result.current.createEvent({
        title: createdEvent.title,
        location: createdEvent.location,
        startsAt: createdEvent.startsAt,
      });
    });

    await waitFor(() => {
      expect(result.current.createdEvent).toEqual(createdEvent);
    });
  });
});
