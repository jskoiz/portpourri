import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ProfileDetailScreen from '../ProfileDetailScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockPass = jest.fn();
const mockLike = jest.fn();
const mockMatches: any[] = [];

const mockNavigation = { navigate: mockNavigate, goBack: mockGoBack } as any;

jest.mock('../../features/discovery/hooks/useDiscoveryActions', () => ({
  useDiscoveryActions: () => ({
    passUser: mockPass,
    likeUser: mockLike,
    isActing: false,
  }),
}));

jest.mock('../../features/matches/hooks/useMatches', () => ({
  useMatches: () => ({
    matches: mockMatches,
    error: null,
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('../../components/ui/AppBackdrop', () => () => null);
jest.mock('../../components/ui/AppBackButton', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');

  return ({ onPress }: { onPress: () => void }) => (
    <Pressable onPress={onPress}>
      <Text>Back</Text>
    </Pressable>
  );
});
jest.mock('../../components/ui/AppIcon', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return () => <Text>icon</Text>;
});
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    LinearGradient: ({ children }: { children?: React.ReactNode }) => <View>{children}</View>,
  };
});
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

const routeUser = {
  id: 'user-2',
  firstName: 'Leilani',
  age: 31,
  profile: {
    bio: 'Early riser and distance runner.',
    city: 'Honolulu',
    intentWorkout: true,
  },
  fitnessProfile: {
    intensityLevel: 'moderate',
    weeklyFrequencyBand: '4-5',
    favoriteActivities: 'Trail Runs, Coffee Walks',
  },
  photos: [],
};

const mockRoute = {
  key: 'ProfileDetail-1',
  name: 'ProfileDetail' as const,
  params: { user: routeUser },
};

describe('ProfileDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPass.mockResolvedValue(undefined);
    mockLike.mockResolvedValue(undefined);
    mockMatches.length = 0;
    mockMatches.push({ id: 'match-1', user: routeUser });
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders profile content from the route params', async () => {
    render(<ProfileDetailScreen navigation={mockNavigation} route={mockRoute as any} />);

    expect(await screen.findByText('Leilani, 31')).toBeTruthy();
    expect(screen.getByText('Honolulu')).toBeTruthy();
    expect(screen.getAllByText('Trail Runs').length).toBeGreaterThan(0);
  });

  it('shows error state when the route has no user payload', () => {
    const nullUserRoute = { ...mockRoute, params: { user: null } };

    render(<ProfileDetailScreen navigation={mockNavigation} route={nullUserRoute as any} />);

    expect(screen.getByText('Profile not found')).toBeTruthy();
    expect(screen.getByText('This profile is no longer available.')).toBeTruthy();
  });

  it('opens chat with a suggested activity when a match already exists', async () => {
    render(<ProfileDetailScreen navigation={mockNavigation} route={mockRoute as any} />);

    fireEvent.press(await screen.findByText('Suggest activity'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Chat', {
        matchId: 'match-1',
        user: routeUser,
        prefillMessage: "Let's plan Trail Runs together.",
      });
    });
  });

  it('shows an alert when liking the profile fails', async () => {
    mockLike.mockRejectedValue(new Error('Like failed'));

    render(<ProfileDetailScreen navigation={mockNavigation} route={mockRoute as any} />);

    fireEvent.press(await screen.findByText('Like'));

    await waitFor(() => {
      expect(mockLike).toHaveBeenCalledWith('user-2');
      expect(Alert.alert).toHaveBeenCalledWith('Could not like profile', 'Like failed');
    });
  });
});
