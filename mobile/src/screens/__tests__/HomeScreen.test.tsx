import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import HomeScreen from '../HomeScreen';

const mockFeed = jest.fn();
const mockUser = {
  firstName: 'Jordan',
  isOnboarded: true,
  profile: {
    intentDating: true,
    intentWorkout: true,
  },
};

jest.mock('../../services/api', () => ({
  discoveryApi: {
    feed: (...args: unknown[]) => mockFeed(...args),
    like: jest.fn(),
    pass: jest.fn(),
    undo: jest.fn(),
  },
}));

jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (state: { user: typeof mockUser }) => unknown) =>
    selector({
      user: mockUser,
    }),
}));

jest.mock('../../components/SwipeDeck', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return () => <Text>Swipe deck</Text>;
});
jest.mock('../../components/MatchAnimation', () => () => null);
jest.mock('../../components/ui/AppBackdrop', () => () => null);
jest.mock('../../components/ui/AppIcon', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return () => <Text>icon</Text>;
});

describe('HomeScreen', () => {
  const navigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFeed.mockResolvedValue({
      data: [
        {
          id: 'user-2',
          firstName: 'Leilani',
        },
      ],
    });
  });

  it('uses quick filters to refetch discovery with API-backed params', async () => {
    render(<HomeScreen navigation={navigation} />);

    expect(await screen.findByText('Swipe deck')).toBeTruthy();

    fireEvent.press(screen.getByText('Strength'));

    await waitFor(() => {
      expect(mockFeed).toHaveBeenLastCalledWith(
        expect.objectContaining({
          goals: ['strength'],
        }),
      );
    });
  });
});
