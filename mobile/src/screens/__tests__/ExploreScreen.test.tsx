import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';
import ExploreScreen from '../ExploreScreen';

const mockNavigate = jest.fn();
const mockRefetch = jest.fn();
const mockUseExploreEvents = jest.fn();

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

jest.mock('../../features/events/hooks/useExploreEvents', () => ({
  useExploreEvents: (...args: unknown[]) => mockUseExploreEvents(...args),
}));

jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (state: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'user-1' } }),
}));

jest.mock('../../features/notifications/hooks/useUnreadNotificationCount', () => ({
  useUnreadNotificationCount: () => ({
    unreadCount: 2,
  }),
}));

jest.mock('../../components/ui/AppNotificationButton', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return () => <Text>Notifications</Text>;
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

describe('ExploreScreen', () => {
  const navigation = {
    navigate: mockNavigate,
  } as any;
  const route = {
    key: 'Explore',
    name: 'Explore',
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseExploreEvents.mockReturnValue({
      error: null,
      events: [
        {
          id: 'trail-1',
          title: 'Makapuu Sunrise Hike',
          location: 'Makapuu Trail',
          category: 'Hiking',
          startsAt: '2026-03-15T16:00:00.000Z',
          host: { id: 'host-1', firstName: 'Nia' },
          attendeesCount: 4,
          joined: false,
        },
        {
          id: 'gym-1',
          title: 'Downtown Strength Hour',
          location: 'Honolulu Strength Lab',
          category: 'Strength',
          startsAt: '2026-03-15T20:00:00.000Z',
          host: { id: 'host-2', firstName: 'Rowan' },
          attendeesCount: 6,
          joined: false,
        },
      ],
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('filters explore content when category pills change', async () => {
    render(<ExploreScreen navigation={navigation} route={route} />);

    expect(await screen.findByText('Makapuu Sunrise Hike')).toBeTruthy();
    expect(screen.getByText('Downtown Strength Hour')).toBeTruthy();

    fireEvent.press(screen.getAllByText('Trails')[0]);

    await waitFor(() => {
      expect(screen.getByText('Trail Events')).toBeTruthy();
      expect(screen.getByText('Makapuu Sunrise Hike')).toBeTruthy();
      expect(screen.queryByText('Downtown Strength Hour')).toBeNull();
      expect(screen.getByText('Trail Spots')).toBeTruthy();
    });

    fireEvent.press(screen.getAllByText('Gyms')[0]);

    await waitFor(() => {
      expect(screen.getByText('Gym Events')).toBeTruthy();
      expect(screen.getByText('Downtown Strength Hour')).toBeTruthy();
      expect(screen.queryByText('Makapuu Sunrise Hike')).toBeNull();
      expect(screen.getByText('Training Spaces')).toBeTruthy();
      expect(screen.getByText('Honolulu Strength Lab')).toBeTruthy();
    });
  });

  it('does not navigate to Create when the Share sheet fails', async () => {
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('sharing unavailable'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(<ExploreScreen navigation={navigation} route={route} />);

    await screen.findByText('Makapuu Sunrise Hike');

    const shareButtons = screen.getAllByText('Share');
    fireEvent.press(shareButtons[0]);

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalledWith('Create');
      expect(console.warn).toHaveBeenCalledWith(
        '[ExploreScreen] Share failed:',
        expect.any(Error),
      );
    });
  });
});
