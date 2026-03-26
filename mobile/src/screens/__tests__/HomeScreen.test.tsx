import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { createScreenNavigation, createScreenRoute } from '../../lib/testing/screenProps';
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
const mockUseAuthStore = jest.fn();

jest.mock('../../features/discovery/hooks/useDiscoveryFeed', () => ({
  useDiscoveryFeed: (...args: unknown[]) => mockUseDiscoveryFeed(...args),
}));

jest.mock('../../features/notifications/hooks/useUnreadNotificationCount', () => ({
  useUnreadNotificationCount: () => ({
    unreadCount: 0,
  }),
}));

jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (state: { user: typeof mockUser | null; isLoading: boolean }) => unknown) =>
    mockUseAuthStore(selector),
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
  const navigation = createScreenNavigation();
  const route = createScreenRoute('Discover');

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
    mockUseAuthStore.mockImplementation((selector) =>
      selector({ user: mockUser, isLoading: false }),
    );
  });

  it('marks quick filters as selected when the user toggles them', async () => {
    render(<HomeScreen navigation={navigation} route={route} />);

    expect(await screen.findByText('Swipe deck')).toBeTruthy();

    const quickFilter = screen.getByLabelText('Filter by Strength');
    fireEvent.press(quickFilter);

    await waitFor(() => {
      expect(screen.getByLabelText('Filter by Strength').props.accessibilityState).toEqual(
        expect.objectContaining({ selected: true }),
      );
    });
  });

  it('surfaces the active filter count after applying bounded discovery controls', async () => {
    render(<HomeScreen navigation={navigation} route={route} />);

    expect(await screen.findByText('Swipe deck')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Increase Distance'));
    fireEvent.press(screen.getByLabelText('Increase Min age'));
    fireEvent.press(screen.getByLabelText('Decrease Max age'));
    fireEvent.press(screen.getByText('Apply'));

    await waitFor(() => {
      expect(screen.getByText('Refine (3)')).toBeTruthy();
    });
  });

  it('does not redirect while auth state is loading', async () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({ user: { ...mockUser, isOnboarded: false }, isLoading: true }),
    );
    render(<HomeScreen navigation={navigation} route={route} />);

    await waitFor(() => {
      expect(navigation.navigate).not.toHaveBeenCalled();
    });
  });

  it('does not redirect on transient auth/me failures with a token retained in storage', async () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({ user: null, isLoading: false }),
    );
    render(<HomeScreen navigation={navigation} route={route} />);

    await waitFor(() => {
      expect(navigation.navigate).not.toHaveBeenCalled();
    });
  });

  it('redirects to onboarding when onboarding is explicitly incomplete', async () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({ user: { ...mockUser, isOnboarded: false }, isLoading: false }),
    );
    render(<HomeScreen navigation={navigation} route={route} />);

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith('Onboarding');
    });
  });
});
