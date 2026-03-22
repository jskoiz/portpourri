import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import MyEventsScreen from '../MyEventsScreen';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockRefetch = jest.fn();
const mockUseMyEvents = jest.fn();

jest.mock('@react-navigation/native', () => {
  const React = require('react');

  return {
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => {
        const cleanup = callback();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, [callback]);
    },
  };
});

jest.mock('../../features/events/hooks/useMyEvents', () => ({
  useMyEvents: (...args: unknown[]) => mockUseMyEvents(...args),
}));

jest.mock('../../components/ui/AppIcon', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return () => <Text>icon</Text>;
});

let mockAuthUser: { id: string } | null = { id: 'current-user-id' };
jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (state: { user: { id: string } | null }) => unknown) =>
    selector({ user: mockAuthUser }),
}));

describe('MyEventsScreen', () => {
  const navigation = {
    canGoBack: () => true,
    goBack: mockGoBack,
    navigate: mockNavigate,
  } as any;
  const route = {
    key: 'MyEvents',
    name: 'MyEvents',
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser = { id: 'current-user-id' };
    mockUseMyEvents.mockReturnValue({
      error: null,
      events: [
        {
          id: 'joined-1',
          title: 'Joined Sunrise Run',
          location: 'Magic Island',
          startsAt: '2026-03-15T16:00:00.000Z',
          joined: true,
          host: { id: 'other-user', firstName: 'Nia' },
        },
      ],
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
  });

  it('renders joined events and shows the created empty state when no hosted events', async () => {
    render(<MyEventsScreen navigation={navigation} route={route} />);

    expect(await screen.findByText('Joined Sunrise Run')).toBeTruthy();
    expect(screen.getByTestId('my-events-tab-joined-count')).toBeTruthy();
    expect(screen.getByTestId('my-events-tab-created-count')).toBeTruthy();

    fireEvent.press(screen.getByText('Created'));

    await waitFor(() => {
      expect(screen.getByText("You haven't hosted anything yet")).toBeTruthy();
    });
  });

  it('shows hosted events in the Created tab and hides them from the Joined tab', async () => {
    mockUseMyEvents.mockReturnValue({
      error: null,
      events: [
        {
          id: 'joined-1',
          title: 'Joined Sunrise Run',
          location: 'Magic Island',
          startsAt: '2026-03-15T16:00:00.000Z',
          joined: true,
          host: { id: 'other-user', firstName: 'Nia' },
        },
        {
          id: 'hosted-1',
          title: 'My Beach Workout',
          location: 'Kailua Beach',
          startsAt: '2026-03-16T08:00:00.000Z',
          joined: true,
          host: { id: 'current-user-id', firstName: 'Jordan' },
        },
      ],
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });

    render(<MyEventsScreen navigation={navigation} route={route} />);

    expect(await screen.findByText('Joined Sunrise Run')).toBeTruthy();
    fireEvent.press(screen.getByText('Created'));

    await waitFor(() => {
      expect(screen.getByText('My Beach Workout')).toBeTruthy();
      expect(screen.queryByText('Joined Sunrise Run')).toBeNull();
      expect(screen.getByTestId('my-events-tab-joined-count')).toBeTruthy();
      expect(screen.getByTestId('my-events-tab-created-count')).toBeTruthy();
    });
  });

  it('does not crash when my events returns malformed rows', async () => {
    mockUseMyEvents.mockReturnValue({
      error: null,
      events: [
        null,
        {
          id: 'joined-2',
          title: 'Mystery Event',
          location: null,
          startsAt: 'not-a-date',
          joined: true,
          host: { id: 'other-user', firstName: 'Unknown' },
        },
      ],
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });

    render(<MyEventsScreen navigation={navigation} route={route} />);

    expect(await screen.findByText('Mystery Event')).toBeTruthy();
    expect(screen.getByText('Date TBD')).toBeTruthy();
  });

  it('does not misclassify events when currentUserId is undefined', async () => {
    mockAuthUser = null;
    mockUseMyEvents.mockReturnValue({
      error: null,
      events: [
        {
          id: 'hosted-1',
          title: 'My Beach Workout',
          location: 'Kailua Beach',
          startsAt: '2026-03-16T08:00:00.000Z',
          joined: true,
          host: { id: 'current-user-id', firstName: 'Jordan' },
        },
      ],
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });

    render(<MyEventsScreen navigation={navigation} route={route} />);

    // With no userId, joined events should still show (not filtered to empty)
    expect(await screen.findByText('My Beach Workout')).toBeTruthy();

    // Created tab should be empty since we can't determine the host
    fireEvent.press(screen.getByText('Created'));
    await waitFor(() => {
      expect(screen.getByText("You haven't hosted anything yet")).toBeTruthy();
    });
  });
});
