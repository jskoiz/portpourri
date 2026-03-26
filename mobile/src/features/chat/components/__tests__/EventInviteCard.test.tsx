import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../lib/testing/renderWithProviders';
import { EventInviteCard } from '../EventInviteCard';

const mockRsvp = jest.fn();

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

  it('navigates to the event when the card is pressed', () => {
    const onNavigateToEvent = jest.fn();

    renderWithProviders(
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
    renderWithProviders(
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

    expect(screen.queryByTestId('event-invite-rsvp-button')).toBeNull();
  });

  it('shows invite sent for invites authored by me', () => {
    renderWithProviders(
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
    renderWithProviders(
      <EventInviteCard
        eventId="event-3"
        title="Climb session"
        location="Honolulu Boulder"
        startsAt={toIsoFromNow(-10)}
        endsAt={toIsoFromNow(-10)}
        status="pending"
        isMe={false}
      />,
    );

    expect(screen.getByText('Event passed')).toBeTruthy();
    expect(screen.queryByTestId('event-invite-rsvp-button')).toBeNull();
  });
});
