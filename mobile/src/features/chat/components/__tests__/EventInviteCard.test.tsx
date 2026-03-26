import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { createQueryTestHarness } from '../../../../lib/testing/queryTestHarness';
import { ThemeProvider } from '../../../../theme/useTheme';
import { queryKeys } from '../../../../lib/query/queryKeys';
import { EventInviteCard } from '../EventInviteCard';

const mockRsvp = jest.fn();
const mockInvalidateEventSurfaces = jest.fn();
const mockShowToast = jest.fn();

jest.mock('../../../../lib/query/queryInvalidation', () => ({
  invalidateEventSurfaces: (...args: unknown[]) =>
    mockInvalidateEventSurfaces(...args),
}));

jest.mock('../../../../store/toastStore', () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}));

function toIsoFromNow(daysFromNow: number) {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
}

jest.mock('../../../../services/api', () => ({
  eventsApi: {
    rsvp: (...args: unknown[]) => mockRsvp(...args),
  },
}));

describe('EventInviteCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRsvp.mockResolvedValue({ data: { status: 'joined', attendeesCount: 10 } });
  });

  function renderWithQueryClient(ui: React.ReactElement) {
    const { queryClient } = createQueryTestHarness();

    function CacheAnchor() {
      useQuery({
        queryKey: queryKeys.events.list(),
        queryFn: async () => [],
        enabled: false,
      });
      useQuery({
        queryKey: queryKeys.events.mine(),
        queryFn: async () => [],
        enabled: false,
      });
      useQuery({
        queryKey: queryKeys.events.detail('event-1'),
        queryFn: async () => null,
        enabled: false,
      });

      return null;
    }

    function Wrapper({ children }: React.PropsWithChildren) {
      return (
        <QueryClientProvider client={queryClient}>
          <CacheAnchor />
          <ThemeProvider>{children}</ThemeProvider>
        </QueryClientProvider>
      );
    }

    return {
      queryClient,
      ...render(ui, { wrapper: Wrapper }),
    };
  }

  it('navigates to the event when the card is pressed', () => {
    const onNavigateToEvent = jest.fn();

    renderWithQueryClient(
      <EventInviteCard
        eventId="event-1"
        title="Sunrise strength session"
        location="Kakaako Waterfront Park"
        startsAt={toIsoFromNow(7)}
        endsAt={toIsoFromNow(7)}
        status="pending"
        isMe={false}
        onNavigateToEvent={onNavigateToEvent}
      />,
    );

    fireEvent.press(screen.getByTestId('event-invite-card'));

    expect(onNavigateToEvent).toHaveBeenCalledWith('event-1');
  });

  it('confirms RSVP and settles into the going state', async () => {
    renderWithQueryClient(
      <EventInviteCard
        eventId="event-1"
        title="Sunrise strength session"
        location="Kakaako Waterfront Park"
        startsAt={toIsoFromNow(7)}
        endsAt={toIsoFromNow(7)}
        status="pending"
        isMe={false}
      />,
    );

    fireEvent.press(screen.getByTestId('event-invite-rsvp-button'));

    await waitFor(() => {
      expect(mockRsvp).toHaveBeenCalledWith('event-1');
    });

    await waitFor(() => {
      expect(screen.getByText('Going')).toBeTruthy();
    });

    expect(mockInvalidateEventSurfaces).toHaveBeenCalled();
    expect(screen.queryByTestId('event-invite-rsvp-button')).toBeNull();
  });

  it('shows a pending RSVP state while the invite is being accepted', async () => {
    let resolveRsvp!: (value: { data: { status: 'joined'; attendeesCount: number } }) => void;
    mockRsvp.mockReturnValue(
      new Promise((resolve) => {
        resolveRsvp = resolve;
      }),
    );

    renderWithQueryClient(
      <EventInviteCard
        eventId="event-1"
        title="Sunrise strength session"
        location="Kakaako Waterfront Park"
        startsAt={toIsoFromNow(7)}
        endsAt={toIsoFromNow(7)}
        status="pending"
        isMe={false}
      />,
    );

    fireEvent.press(screen.getByTestId('event-invite-rsvp-button'));

    await waitFor(() => {
      expect(screen.getByTestId('event-invite-rsvp-button').props.accessibilityLabel).toBe(
        'Joining...',
      );
      expect(screen.getByTestId('event-invite-rsvp-button').props.accessibilityState.disabled).toBe(
        true,
      );
    });

    await act(async () => {
      resolveRsvp({ data: { status: 'joined', attendeesCount: 10 } });
    });

    await waitFor(() => {
      expect(screen.getByText('Going')).toBeTruthy();
    });
  });

  it('updates event caches when RSVP succeeds', async () => {
    const { queryClient } = renderWithQueryClient(
      <EventInviteCard
        eventId="event-1"
        title="Sunrise strength session"
        location="Kakaako Waterfront Park"
        startsAt={toIsoFromNow(7)}
        endsAt={toIsoFromNow(7)}
        status="pending"
        isMe={false}
      />,
    );

    const cachedEvent = {
      id: 'event-1',
      title: 'Sunrise strength session',
      description: null,
      location: 'Kakaako Waterfront Park',
      imageUrl: null,
      category: null,
      startsAt: toIsoFromNow(7),
      endsAt: toIsoFromNow(7),
      host: { id: 'host-1', firstName: 'Mia' },
      attendeesCount: 9,
      joined: false,
    };

    queryClient.setQueryData(queryKeys.events.list(), [cachedEvent]);
    queryClient.setQueryData(queryKeys.events.mine(), [cachedEvent]);
    queryClient.setQueryData(queryKeys.events.detail('event-1'), cachedEvent);

    fireEvent.press(screen.getByTestId('event-invite-rsvp-button'));

    await waitFor(() => {
      expect(queryClient.getQueryData(queryKeys.events.list())).toEqual([
        expect.objectContaining({ joined: true, attendeesCount: 10 }),
      ]);
      expect(queryClient.getQueryData(queryKeys.events.mine())).toEqual([
        expect.objectContaining({ joined: true, attendeesCount: 10 }),
      ]);
      expect(queryClient.getQueryData(queryKeys.events.detail('event-1'))).toEqual(
        expect.objectContaining({ joined: true, attendeesCount: 10 }),
      );
    });
  });

  it('restores event caches and surfaces an error when RSVP fails', async () => {
    mockRsvp.mockRejectedValueOnce(new Error('Network error'));

    const { queryClient } = renderWithQueryClient(
      <EventInviteCard
        eventId="event-1"
        title="Sunrise strength session"
        location="Kakaako Waterfront Park"
        startsAt={toIsoFromNow(7)}
        endsAt={toIsoFromNow(7)}
        status="pending"
        isMe={false}
      />,
    );

    const cachedEvent = {
      id: 'event-1',
      title: 'Sunrise strength session',
      description: null,
      location: 'Kakaako Waterfront Park',
      imageUrl: null,
      category: null,
      startsAt: toIsoFromNow(7),
      endsAt: toIsoFromNow(7),
      host: { id: 'host-1', firstName: 'Mia' },
      attendeesCount: 9,
      joined: false,
    };

    queryClient.setQueryData(queryKeys.events.list(), [cachedEvent]);
    queryClient.setQueryData(queryKeys.events.mine(), [cachedEvent]);
    queryClient.setQueryData(queryKeys.events.detail('event-1'), cachedEvent);

    fireEvent.press(screen.getByTestId('event-invite-rsvp-button'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Could not RSVP to the event.',
        'error',
      );
      expect(queryClient.getQueryData(queryKeys.events.list())).toEqual([cachedEvent]);
      expect(queryClient.getQueryData(queryKeys.events.mine())).toEqual([cachedEvent]);
      expect(queryClient.getQueryData(queryKeys.events.detail('event-1'))).toEqual(
        cachedEvent,
      );
    });
  });

  it('shows invite sent for invites authored by me', () => {
    renderWithQueryClient(
      <EventInviteCard
        eventId="event-2"
        title="Trail recovery run"
        location="Magic Island"
        startsAt={toIsoFromNow(10)}
        endsAt={toIsoFromNow(10)}
        status="pending"
        isMe
      />,
    );

    expect(screen.getByText('Invite sent')).toBeTruthy();
    expect(screen.queryByTestId('event-invite-rsvp-button')).toBeNull();
  });

  it('marks expired pending invites as past events', () => {
    renderWithQueryClient(
      <EventInviteCard
        eventId="event-3"
        title="Climb session"
        location="Honolulu Boulder"
        startsAt={toIsoFromNow(10)}
        endsAt={toIsoFromNow(-1)}
        status="pending"
        isMe={false}
      />,
    );

    expect(screen.getByText('Event passed')).toBeTruthy();
    expect(screen.queryByTestId('event-invite-rsvp-button')).toBeNull();
  });
});
