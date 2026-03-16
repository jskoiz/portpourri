import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ProfileDetailScreen from '../ProfileDetailScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockPass = jest.fn();
const mockLike = jest.fn();
const mockMatchesList = jest.fn();
const mockUseRoute = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => mockUseRoute(),
}));

jest.mock('../../services/api', () => ({
  discoveryApi: {
    pass: (...args: unknown[]) => mockPass(...args),
    like: (...args: unknown[]) => mockLike(...args),
  },
  matchesApi: {
    list: (...args: unknown[]) => mockMatchesList(...args),
  },
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

describe('ProfileDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRoute.mockReturnValue({
      params: {
        user: routeUser,
      },
    });
    mockPass.mockResolvedValue(undefined);
    mockLike.mockResolvedValue(undefined);
    mockMatchesList.mockResolvedValue({
      data: [
        {
          id: 'match-1',
          user: routeUser,
        },
      ],
    });
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders profile content from the route params', async () => {
    render(<ProfileDetailScreen />);

    expect(await screen.findByText('Leilani, 31')).toBeTruthy();
    expect(screen.getByText('Honolulu')).toBeTruthy();
    expect(screen.getAllByText('Trail Runs').length).toBeGreaterThan(0);
  });

  it('returns null when the route has no user payload', () => {
    mockUseRoute.mockReturnValue({
      params: {
        user: null,
      },
    });

    const { toJSON } = render(<ProfileDetailScreen />);

    expect(toJSON()).toBeNull();
  });

  it('opens chat with a suggested activity when a match already exists', async () => {
    render(<ProfileDetailScreen />);

    fireEvent.press(await screen.findByText('Suggest activity'));

    await waitFor(() => {
      expect(mockMatchesList).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('Chat', {
        matchId: 'match-1',
        user: routeUser,
        prefillMessage: "Let's plan Trail Runs together.",
      });
    });
  });

  it('shows an alert when liking the profile fails', async () => {
    mockLike.mockRejectedValue(new Error('Like failed'));

    render(<ProfileDetailScreen />);

    fireEvent.press(await screen.findByText('Like'));

    await waitFor(() => {
      expect(mockLike).toHaveBeenCalledWith('user-2');
      expect(Alert.alert).toHaveBeenCalledWith('Could not like profile', 'Like failed');
    });
  });
});
