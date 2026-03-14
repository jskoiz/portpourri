import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';
import ExploreScreen from '../ExploreScreen';

const mockList = jest.fn();
const mockNavigate = jest.fn();

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
    list: (...args: unknown[]) => mockList(...args),
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

describe('ExploreScreen', () => {
  const navigation = {
    navigate: mockNavigate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({
      data: [
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
    });
  });

  it('filters explore content when category pills change', async () => {
    render(<ExploreScreen navigation={navigation} />);

    expect(await screen.findByText('Makapuu Sunrise Hike')).toBeTruthy();
    expect(screen.getByText('Downtown Strength Hour')).toBeTruthy();

    fireEvent.press(screen.getByText('Trails'));

    await waitFor(() => {
      expect(screen.getByText('Trail Events')).toBeTruthy();
      expect(screen.getByText('Makapuu Sunrise Hike')).toBeTruthy();
      expect(screen.queryByText('Downtown Strength Hour')).toBeNull();
      expect(screen.getByText('Trail Spots')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Gyms'));

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

    render(<ExploreScreen navigation={navigation} />);

    await screen.findByText('Makapuu Sunrise Hike');

    const shareButtons = screen.getAllByText('Share');
    fireEvent.press(shareButtons[0]);

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalledWith('Create');
    });
  });
});
