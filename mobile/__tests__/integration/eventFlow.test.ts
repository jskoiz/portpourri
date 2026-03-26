/**
 * Integration test: Event flow
 *
 * Verifies the events lifecycle:
 *   Browse events -> RSVP -> view detail with attendees -> cancel (toggle) RSVP
 *
 * Mocks the API layer at the boundary, exercises real hooks
 * (useExploreEvents, useEventDetail, useMyEvents) and the React Query cache.
 */
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useExploreEvents } from '../../src/features/events/hooks/useExploreEvents';
import { useEventDetail } from '../../src/features/events/hooks/useEventDetail';
import { useMyEvents } from '../../src/features/events/hooks/useMyEvents';
import type { EventSummary, EventDetail } from '../../src/api/types';
import { createQueryTestHarness } from '../../src/lib/testing/queryTestHarness';

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

const mockEventsList = jest.fn();
const mockEventsDetail = jest.fn();
const mockEventsRsvp = jest.fn();
const mockEventsMine = jest.fn();

jest.mock('../../src/services/api', () => ({
  eventsApi: {
    list: (...args: unknown[]) => mockEventsList(...args),
    detail: (...args: unknown[]) => mockEventsDetail(...args),
    rsvp: (...args: unknown[]) => mockEventsRsvp(...args),
    mine: (...args: unknown[]) => mockEventsMine(...args),
  },
}));

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

const events: EventSummary[] = [
  {
    id: 'evt-1',
    title: 'Morning Yoga at Cheesman',
    description: 'Relaxing morning yoga session in the park.',
    location: 'Cheesman Park, Denver',
    category: 'yoga',
    startsAt: '2025-06-15T08:00:00Z',
    endsAt: '2025-06-15T09:00:00Z',
    host: { id: 'u-host', firstName: 'Lana' },
    attendeesCount: 5,
    joined: false,
    imageUrl: null,
  },
  {
    id: 'evt-2',
    title: 'CrossFit Competition',
    description: 'Friendly CrossFit comp.',
    location: 'CrossFit Denver',
    category: 'crossfit',
    startsAt: '2025-06-20T10:00:00Z',
    endsAt: '2025-06-20T12:00:00Z',
    host: { id: 'u-host2', firstName: 'Mason' },
    attendeesCount: 12,
    joined: true,
    imageUrl: null,
  },
];

const eventDetail: EventDetail = {
  ...events[0],
};

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('Event flow integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -- Browse events (explore list) -----------------------------------
  it('loads and returns list of events', async () => {
    mockEventsList.mockResolvedValue({ data: events });
    const { wrapper } = createQueryTestHarness();

    const { result } = renderHook(() => useExploreEvents(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.events).toHaveLength(2);
    expect(result.current.events[0].title).toBe('Morning Yoga at Cheesman');
    expect(result.current.events[1].joined).toBe(true);
  });

  // -- View event detail -----------------------------------------------
  it('loads event detail by ID', async () => {
    mockEventsDetail.mockResolvedValue({ data: eventDetail });
    const { wrapper } = createQueryTestHarness();

    const { result } = renderHook(() => useEventDetail('evt-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.event).toEqual(eventDetail);
    expect(result.current.event?.title).toBe('Morning Yoga at Cheesman');
    expect(result.current.event?.attendeesCount).toBe(5);
    expect(result.current.event?.joined).toBe(false);
  });

  // -- RSVP to an event -----------------------------------------------
  it('RSVP optimistically updates joined status and attendee count', async () => {
    mockEventsDetail.mockResolvedValue({ data: { ...eventDetail } });
    mockEventsRsvp.mockResolvedValue({
      data: { status: 'joined', attendeesCount: 6 },
    });
    const { wrapper } = createQueryTestHarness();

    const { result } = renderHook(() => useEventDetail('evt-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.event?.joined).toBe(false);
    expect(result.current.event?.attendeesCount).toBe(5);

    await act(async () => {
      await result.current.joinEvent();
    });

    expect(mockEventsRsvp).toHaveBeenCalled();

    // After settlement, server value should be applied
    await waitFor(() => {
      expect(result.current.event?.joined).toBe(true);
      expect(result.current.event?.attendeesCount).toBe(6);
    });
  });

  // -- RSVP error rolls back optimistic update ------------------------
  it('RSVP error rolls back to previous state', async () => {
    mockEventsDetail.mockResolvedValue({ data: { ...eventDetail } });
    mockEventsRsvp.mockRejectedValue(new Error('RSVP failed'));
    const { wrapper } = createQueryTestHarness();

    const { result } = renderHook(() => useEventDetail('evt-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await act(async () => {
      try {
        await result.current.joinEvent();
      } catch {
        // expected
      }
    });

    warnSpy.mockRestore();

    // Should roll back to unjoined state
    await waitFor(() => {
      expect(result.current.event?.joined).toBe(false);
      expect(result.current.event?.attendeesCount).toBe(5);
    });
  });

  // -- My events list -------------------------------------------------
  it('loads list of events the user has joined', async () => {
    const myEvents = [events[1]]; // only the CrossFit one
    mockEventsMine.mockResolvedValue({ data: myEvents });
    const { wrapper } = createQueryTestHarness();

    const { result } = renderHook(() => useMyEvents(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].title).toBe('CrossFit Competition');
    expect(result.current.events[0].joined).toBe(true);
  });

  // -- Event detail not found (empty ID) ------------------------------
  it('does not fetch when eventId is empty', () => {
    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useEventDetail(''), { wrapper });

    // Query should not fire (enabled: false)
    expect(result.current.event).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(mockEventsDetail).not.toHaveBeenCalled();
  });

  // -- Explore events returns empty list gracefully -------------------
  it('returns empty events array when API returns empty list', async () => {
    mockEventsList.mockResolvedValue({ data: [] });
    const { wrapper } = createQueryTestHarness();

    const { result } = renderHook(() => useExploreEvents(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.events).toEqual([]);
  });

  // -- Explore events handles API error --------------------------------
  it('handles API error gracefully for event list', async () => {
    mockEventsList.mockRejectedValue(new Error('Server error'));
    const { wrapper } = createQueryTestHarness();

    const { result } = renderHook(() => useExploreEvents(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });

  // -- isJoining flag during RSVP ------------------------------------
  it('isJoining is true while RSVP mutation is pending', async () => {
    mockEventsDetail.mockResolvedValue({ data: { ...eventDetail } });
    const { wrapper } = createQueryTestHarness();

    let resolveRsvp!: (value: unknown) => void;
    mockEventsRsvp.mockReturnValue(
      new Promise((resolve) => {
        resolveRsvp = resolve;
      }),
    );

    const { result } = renderHook(() => useEventDetail('evt-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    let joinPromise: Promise<unknown>;
    act(() => {
      joinPromise = result.current.joinEvent();
    });

    // While pending, isJoining should be true
    await waitFor(() => expect(result.current.isJoining).toBe(true));

    // Resolve
    await act(async () => {
      resolveRsvp({ data: { status: 'joined', attendeesCount: 6 } });
      await joinPromise!;
    });

    await waitFor(() => expect(result.current.isJoining).toBe(false));
  });

  it('adds the joined event to my-events cache after RSVP succeeds', async () => {
    mockEventsDetail.mockResolvedValue({ data: { ...eventDetail } });
    mockEventsMine.mockResolvedValue({ data: [] });
    mockEventsRsvp.mockResolvedValue({
      data: { status: 'joined', attendeesCount: 6 },
    });

    const { wrapper } = createQueryTestHarness();
    const detailHook = renderHook(() => useEventDetail('evt-1'), { wrapper });
    const mineHook = renderHook(() => useMyEvents(), { wrapper });

    await waitFor(() => expect(detailHook.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(mineHook.result.current.isSuccess).toBe(true));

    await act(async () => {
      await detailHook.result.current.joinEvent();
    });

    await waitFor(() => {
      expect(mineHook.result.current.events).toEqual([
        expect.objectContaining({
          id: 'evt-1',
          joined: true,
          attendeesCount: 6,
        }),
      ]);
    });
  });
});
