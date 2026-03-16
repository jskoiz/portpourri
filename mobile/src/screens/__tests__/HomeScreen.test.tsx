import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import HomeScreen from '../HomeScreen';

const mockUseDiscoveryFeed = jest.fn();
const mockPassUser = jest.fn();
const mockLikeUser = jest.fn();
const mockUndoSwipe = jest.fn();
const mockRefetch = jest.fn();
const mockUser = {
  firstName: 'Jordan',
  isOnboarded: true,
  profile: {
    intentDating: true,
    intentWorkout: true,
  },
};

jest.mock('../../features/discovery/hooks/useDiscoveryFeed', () => ({
  useDiscoveryFeed: (...args: unknown[]) => mockUseDiscoveryFeed(...args),
}));

jest.mock('../../features/notifications/hooks/useUnreadNotificationCount', () => ({
  useUnreadNotificationCount: () => ({
    unreadCount: 0,
  }),
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
  } as any;
  const route = {
    key: 'Discover',
    name: 'Discover',
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDiscoveryFeed.mockReturnValue({
      error: null,
      feed: [
        {
          id: 'user-2',
          firstName: 'Leilani',
        },
      ],
      isLoading: false,
      likeUser: mockLikeUser,
      passUser: mockPassUser,
      refetch: mockRefetch,
      undoSwipe: mockUndoSwipe,
    });
  });

  it('uses quick filters to refetch discovery with API-backed params', async () => {
    render(<HomeScreen navigation={navigation} route={route} />);

    expect(await screen.findByText('Swipe deck')).toBeTruthy();

    fireEvent.press(screen.getByText('Strength'));

    await waitFor(() => {
      expect(mockUseDiscoveryFeed).toHaveBeenLastCalledWith(
        expect.objectContaining({
          goals: ['strength'],
        }),
      );
    });
  });

  it('applies bounded discovery filter values without free-typed inputs', async () => {
    render(<HomeScreen navigation={navigation} route={route} />);

    expect(await screen.findByText('Swipe deck')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Increase Distance'));
    fireEvent.press(screen.getByLabelText('Increase Min age'));
    fireEvent.press(screen.getByLabelText('Decrease Max age'));
    fireEvent.press(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockUseDiscoveryFeed).toHaveBeenLastCalledWith(
        expect.objectContaining({
          distanceKm: 51,
          minAge: 22,
          maxAge: 44,
        }),
      );
    });
  });
});
