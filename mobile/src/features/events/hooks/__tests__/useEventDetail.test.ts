import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { EventSummary } from '../../../../api/types';
import { queryKeys } from '../../../../lib/query/queryKeys';
import { createQueryTestHarness } from '../../../../lib/testing/queryTestHarness';
import { useEventDetail } from '../useEventDetail';

const mockDetail = jest.fn();
const mockRsvp = jest.fn();
const mockShowToast = jest.fn();

jest.mock('../../../../services/api', () => ({
  eventsApi: {
    detail: (...args: unknown[]) => mockDetail(...args),
    rsvp: (...args: unknown[]) => mockRsvp(...args),
  },
}));

jest.mock('../../../../store/toastStore', () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
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
    attendeesCount: overrides.attendeesCount ?? 4,
    joined: overrides.joined ?? false,
  };
}

describe('useEventDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('joins an event and keeps list, mine, and detail caches in sync', async () => {
    const event = makeEvent({ id: 'event-1', attendeesCount: 4 });
    mockDetail.mockResolvedValue({ data: event });
    mockRsvp.mockResolvedValue({ data: { status: 'joined', attendeesCount: 5 } });

    const { queryClient, wrapper } = createQueryTestHarness();
    queryClient.setQueryData(queryKeys.events.list(), [event]);
    queryClient.setQueryData(queryKeys.events.mine(), [event]);

    const { result } = renderHook(() => useEventDetail('event-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.joinEvent();
    });

    await waitFor(() => {
      expect(result.current.event).toEqual({
        ...event,
        joined: true,
        attendeesCount: 5,
        attendees: [],
      });
      expect(mockShowToast).toHaveBeenCalledWith('RSVP confirmed!', 'success');
    });
  });

  it('restores the prior event caches when RSVP fails', async () => {
    const event = makeEvent({ id: 'event-1', attendeesCount: 4 });
    mockDetail.mockResolvedValue({ data: event });
    mockRsvp.mockRejectedValueOnce(new Error('Network error'));

    const { queryClient, wrapper } = createQueryTestHarness();
    queryClient.setQueryData(queryKeys.events.detail(event.id), event);

    const { result } = renderHook(() => useEventDetail('event-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await expect(result.current.joinEvent()).rejects.toThrow('Network error');
    });

    await waitFor(() => {
      expect(result.current.event).toEqual(event);
    });

    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
