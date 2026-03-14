import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import MyEventsScreen from '../MyEventsScreen';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockMine = jest.fn();

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

jest.mock('../../services/api', () => ({
  eventsApi: {
    mine: (...args: unknown[]) => mockMine(...args),
  },
}));

jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (state: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'current-user-id' } }),
}));

describe('MyEventsScreen', () => {
  const navigation = {
    canGoBack: () => true,
    goBack: mockGoBack,
    navigate: mockNavigate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMine.mockResolvedValue({
      data: [
        {
          id: 'joined-1',
          title: 'Joined Sunrise Run',
          location: 'Magic Island',
          startsAt: '2026-03-15T16:00:00.000Z',
          joined: true,
          host: { id: 'other-user', firstName: 'Nia' },
        },
      ],
    });
  });

  it('renders joined events and shows the created empty state when no hosted events', async () => {
    render(<MyEventsScreen navigation={navigation} />);

    expect(await screen.findByText('Joined Sunrise Run')).toBeTruthy();

    fireEvent.press(screen.getByText('Created'));

    await waitFor(() => {
      expect(screen.getByText("You haven't hosted anything yet")).toBeTruthy();
    });
  });

  it('shows hosted events in the Created tab and hides them from the Joined tab', async () => {
    mockMine.mockResolvedValue({
      data: [
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
          host: { id: 'current-user-id', firstName: 'Me' },
        },
      ],
    });

    render(<MyEventsScreen navigation={navigation} />);

    expect(await screen.findByText('Joined Sunrise Run')).toBeTruthy();

    fireEvent.press(screen.getByText('Created'));

    await waitFor(() => {
      expect(screen.getByText('My Beach Workout')).toBeTruthy();
      expect(screen.queryByText('Joined Sunrise Run')).toBeNull();
    });
  });

  it('does not crash when my events returns malformed rows', async () => {
    mockMine.mockResolvedValue({
      data: [
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
    });

    render(<MyEventsScreen navigation={navigation} />);

    expect(await screen.findByText('Mystery Event')).toBeTruthy();
    expect(screen.getByText('Date TBD')).toBeTruthy();
  });
});
