import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { EventSummary } from '../../../../api/types';
import { SuggestPlanSheet } from '../SuggestPlanSheet';

const mockUseMyEvents = jest.fn();

function toIsoFromNow(daysFromNow: number) {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
}

jest.mock('../../../events/hooks/useMyEvents', () => ({
  useMyEvents: (...args: unknown[]) => mockUseMyEvents(...args),
}));

const mockRefObject = { current: null };
const controller = {
  onChangeIndex: jest.fn(),
  onDismiss: jest.fn(),
  onRequestClose: jest.fn(),
  refObject: mockRefObject,
  visible: true,
};

function makeEvent(overrides: Partial<EventSummary> = {}): EventSummary {
  return {
    id: overrides.id ?? 'event-1',
    title: overrides.title ?? 'Sunrise yoga',
    description: overrides.description ?? null,
    location: overrides.location ?? 'Magic Island',
    imageUrl: overrides.imageUrl ?? null,
    category: overrides.category ?? 'Yoga',
    startsAt: overrides.startsAt ?? toIsoFromNow(7),
    endsAt: overrides.endsAt ?? toIsoFromNow(7),
    host: overrides.host ?? { id: 'host-1', firstName: 'Nia' },
    attendeesCount: overrides.attendeesCount ?? 5,
    joined: overrides.joined ?? false,
  };
}

describe('SuggestPlanSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filters out past events and sends a future event invite', () => {
    const futureEvent = makeEvent({
      id: 'event-future-1',
      title: 'Sunrise yoga',
      startsAt: toIsoFromNow(7),
    });
    const pastEvent = makeEvent({
      id: 'event-past-1',
      title: 'Trail brunch',
      startsAt: toIsoFromNow(-7),
    });
    const onClose = jest.fn();
    const onSelectEvent = jest.fn();

    mockUseMyEvents.mockReturnValue({
      events: [futureEvent, pastEvent],
      isLoading: false,
    });

    render(
      <SuggestPlanSheet
        controller={controller}
        onClose={onClose}
        onCreateEvent={jest.fn()}
        onSelectEvent={onSelectEvent}
      />,
    );

    expect(screen.getByText('Sunrise yoga')).toBeTruthy();
    expect(screen.queryByText('Trail brunch')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Send invite' }));

    expect(onClose).toHaveBeenCalled();
    expect(onSelectEvent).toHaveBeenCalledWith(futureEvent);
  });

  it('starts the create-event flow from the shortcut card', () => {
    const onClose = jest.fn();
    const onCreateEvent = jest.fn();

    mockUseMyEvents.mockReturnValue({
      events: [],
      isLoading: false,
    });

    render(
      <SuggestPlanSheet
        controller={controller}
        onClose={onClose}
        onCreateEvent={onCreateEvent}
        onSelectEvent={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByText('Create a new event'));

    expect(onClose).toHaveBeenCalled();
    expect(onCreateEvent).toHaveBeenCalled();
  });
});
