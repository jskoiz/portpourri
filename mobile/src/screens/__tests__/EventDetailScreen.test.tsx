import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../lib/testing/renderWithProviders';
import EventDetailScreen, { EventDetailView } from '../EventDetailScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('../../features/events/hooks/useEventDetailScreenController', () => ({
  useEventDetailScreenController: jest.fn(),
}));

const { useEventDetailScreenController } = jest.requireMock(
  '../../features/events/hooks/useEventDetailScreenController',
) as {
  useEventDetailScreenController: jest.Mock;
};

jest.mock('../../components/ui/AppBackButton', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ onPress }: { onPress: () => void }) => (
    <Text onPress={onPress}>Back</Text>
  );
});

jest.mock('../../components/ui/AppBackdrop', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../components/ui/AppIcon', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ name }: { name: string }) => <Text>{name}</Text>;
});

describe('EventDetailView', () => {
  const baseEvent = {
    id: 'event-1',
    title: 'Sunrise Run',
    description: 'Easy pace along the water.',
    location: 'Magic Island',
    imageUrl: null,
    category: 'running',
    startsAt: '2026-03-28T18:00:00.000Z',
    endsAt: '2026-03-28T19:00:00.000Z',
    host: { id: 'host-1', firstName: 'Ava' },
    attendeesCount: 6,
    joined: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useEventDetailScreenController.mockReturnValue({
      errorMessage: null,
      event: baseEvent,
      isJoining: false,
      isLoading: false,
      onBack: mockGoBack,
      onJoin: jest.fn(),
      onRefresh: jest.fn(),
    });
  });

  it('renders the join button for guests', () => {
    const onJoin = jest.fn();
    const onPressHost = jest.fn();

    renderWithProviders(
      <EventDetailView
        errorMessage={null}
        event={baseEvent}
        isJoining={false}
        isLoading={false}
        onBack={jest.fn()}
        onJoin={onJoin}
        onPressHost={onPressHost}
        onRefresh={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByText('Join event'));
    expect(onJoin).toHaveBeenCalled();
  });

  it('opens the host profile from the host strip', () => {
    const onPressHost = jest.fn();

    renderWithProviders(
      <EventDetailView
        errorMessage={null}
        event={baseEvent}
        isJoining={false}
        isLoading={false}
        onBack={jest.fn()}
        onJoin={jest.fn()}
        onPressHost={onPressHost}
        onRefresh={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByLabelText('Open profile for Ava'));

    expect(onPressHost).toHaveBeenCalledTimes(1);
  });

  it('navigates to the host profile from the event detail screen', () => {
    renderWithProviders(
      <EventDetailScreen
        navigation={{ navigate: mockNavigate, goBack: mockGoBack } as any}
        route={{ key: 'EventDetail-1', name: 'EventDetail', params: { eventId: 'event-1' } } as any}
      />,
    );

    fireEvent.press(screen.getByLabelText('Open profile for Ava'));

    expect(mockNavigate).toHaveBeenCalledWith('ProfileDetail', {
      user: baseEvent.host,
      userId: 'host-1',
    });
  });
});
