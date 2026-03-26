import React from 'react';
import { act, render } from '@testing-library/react-native';
import SwipeDeck from '../SwipeDeck';
import {
  buildSwipeDeckCardViewModel,
  clampCardHeight,
} from '../swipeDeck/swipeDeck.presentation';

let onSwipedAllCallback: (() => void) | null = null;
let latestSwiperProps: Record<string, unknown> | null = null;

jest.mock('react-native-deck-swiper', () => {
  const React = require('react');
  const { View } = require('react-native');

  return function MockSwiper(props: {
    cards: unknown[];
    onSwipedAll?: () => void;
    renderCard: (card: unknown) => React.ReactElement;
  }) {
    const { cards, renderCard, onSwipedAll } = props;
    onSwipedAllCallback = onSwipedAll || null;
    latestSwiperProps = props;

    return (
      <View>
        {cards.map((card: unknown, i: number) => (
          <View key={i}>{renderCard(card)}</View>
        ))}
      </View>
    );
  };
});

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    LinearGradient: ({ children }: { children?: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock('../ui/AppIcon', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return ({ name }: { name: string }) => <Text>{name}</Text>;
});

describe('SwipeDeck', () => {
  const noop = () => {};

  beforeEach(() => {
    latestSwiperProps = null;
  });

  it('renders empty state when data is empty', () => {
    const { getByText } = render(<SwipeDeck data={[]} onSwipeLeft={noop} onSwipeRight={noop} />);
    expect(getByText('No new profiles tonight')).toBeTruthy();
  });

  it('resets empty state when a fresh dataset arrives after swiping all cards', () => {
    const { getByText, rerender, queryByText } = render(
      <SwipeDeck data={[{ id: 'old-1', firstName: 'Kai' }]} onSwipeLeft={noop} onSwipeRight={noop} />,
    );

    act(() => {
      onSwipedAllCallback?.();
    });
    expect(getByText('No new profiles tonight')).toBeTruthy();

    rerender(
      <SwipeDeck
        data={[{ id: 'new-1', firstName: 'Rae' }, { id: 'new-2', firstName: 'Mika' }]}
        onSwipeLeft={noop}
        onSwipeRight={noop}
      />,
    );

    expect(queryByText('No new profiles tonight')).toBeFalsy();
    expect(getByText('Rae')).toBeTruthy();
  });

  it('renders cards and tolerates duplicate chip labels from multiple fields', () => {
    const user = {
      id: 'u1',
      firstName: 'Alex',
      fitnessProfile: {
        favoriteActivities: 'cardio',
        primaryGoal: 'cardio',
        weeklyFrequencyBand: '3',
      },
    };

    const { getByText } = render(
      <SwipeDeck data={[user]} onSwipeLeft={noop} onSwipeRight={noop} />,
    );

    expect(getByText('Alex')).toBeTruthy();
  });

  it('uses index-based keys so duplicate chip text still renders twice', () => {
    const user = {
      id: 'u2',
      firstName: 'Blake',
      fitnessProfile: {
        favoriteActivities: 'trail_run',
        primaryGoal: 'trail_run',
        weeklyFrequencyBand: '3',
      },
    };

    const { getAllByText } = render(
      <SwipeDeck data={[user]} onSwipeLeft={noop} onSwipeRight={noop} />,
    );

    expect(getAllByText('Trail Run')).toHaveLength(2);
  });

  it('formats snake_case goals into title-cased chip labels', () => {
    const user = {
      id: 'u3',
      firstName: 'Casey',
      fitnessProfile: {
        primaryGoal: 'improve_upper_body',
      },
    };

    const { getByText } = render(
      <SwipeDeck data={[user]} onSwipeLeft={noop} onSwipeRight={noop} />,
    );

    expect(getByText('Improve Upper Body')).toBeTruthy();
  });

  it('renders an alignment badge when recommendationScore is present', () => {
    const user = {
      id: 'u4',
      firstName: 'Jordan',
      recommendationScore: 82,
      profile: {
        city: 'Manoa',
      },
      fitnessProfile: {
        favoriteActivities: 'yoga',
      },
    };

    const { getByText, queryByText } = render(
      <SwipeDeck data={[user]} onSwipeLeft={noop} onSwipeRight={noop} />,
    );

    expect(getByText('82% aligned')).toBeTruthy();
    expect(queryByText('Available tonight')).toBeNull();
  });

  it('limits profile chips to the two highest-priority labels', () => {
    const user = {
      id: 'u5',
      firstName: 'Kai',
      fitnessProfile: {
        favoriteActivities: 'surfing',
        primaryGoal: 'endurance',
        prefersMorning: true,
      },
    };

    const { getByText, queryByText } = render(
      <SwipeDeck data={[user]} onSwipeLeft={noop} onSwipeRight={noop} />,
    );

    expect(getByText('Surfing')).toBeTruthy();
    expect(getByText('Endurance')).toBeTruthy();
    expect(queryByText('Mornings')).toBeNull();
  });

  it('derives the intent badge from discovery profile flags', () => {
    const user = {
      id: 'u6',
      firstName: 'Rae',
      profile: {
        intentDating: false,
        intentWorkout: true,
      },
    };

    const { getByText } = render(
      <SwipeDeck data={[user]} onSwipeLeft={noop} onSwipeRight={noop} />,
    );

    expect(getByText('Training')).toBeTruthy();
  });

  it('shows zero distance instead of hiding it', () => {
    const user = {
      id: 'u7',
      firstName: 'Mika',
      distanceKm: 0,
      profile: {
        city: 'Kakaako',
      },
    };

    const { getByText } = render(
      <SwipeDeck data={[user]} onSwipeLeft={noop} onSwipeRight={noop} />,
    );

    expect(getByText('Kakaako · 0 km away')).toBeTruthy();
  });

  it('dispatches onSwipeLeft with the correct user', () => {
    const onSwipeLeft = jest.fn();
    const user = { id: 'u8', firstName: 'Nalu' };

    render(<SwipeDeck data={[user]} onSwipeLeft={onSwipeLeft} onSwipeRight={noop} />);

    act(() => {
      (latestSwiperProps?.onSwipedLeft as ((index: number) => void) | undefined)?.(0);
    });

    expect(onSwipeLeft).toHaveBeenCalledWith(user);
  });

  it('dispatches onSwipeRight with the correct user', () => {
    const onSwipeRight = jest.fn();
    const user = { id: 'u8', firstName: 'Nalu' };

    render(<SwipeDeck data={[user]} onSwipeLeft={noop} onSwipeRight={onSwipeRight} />);

    act(() => {
      (latestSwiperProps?.onSwipedRight as ((index: number) => void) | undefined)?.(0);
    });

    expect(onSwipeRight).toHaveBeenCalledWith(user);
  });

  it('keeps vertical swipes disabled in the current deck configuration', () => {
    render(
      <SwipeDeck
        data={[{ id: 'u9', firstName: 'Noa' }]}
        onSwipeLeft={noop}
        onSwipeRight={noop}
      />,
    );

    expect(latestSwiperProps).toEqual(
      expect.objectContaining({
        disableBottomSwipe: true,
        disableTopSwipe: true,
      }),
    );
  });
});

describe('swipe deck presentation helpers', () => {
  it('clamps card height to allowed range with a sane default', () => {
    expect(clampCardHeight()).toBe(520);
    expect(clampCardHeight(Number.NaN)).toBe(520);
    expect(clampCardHeight(100)).toBe(360);
    expect(clampCardHeight(900)).toBe(680);
  });

  it('builds compact view model labels and fallbacks', () => {
    const user = {
      id: 'u8',
      firstName: 'Noa',
      age: 26,
      distanceKm: 4.2,
      recommendationScore: 0.82,
      profile: {
        city: 'Kailua',
      },
      fitnessProfile: {
        favoriteActivities: 'trail_run',
      },
    } as Parameters<typeof buildSwipeDeckCardViewModel>[0];
    const viewModel = buildSwipeDeckCardViewModel(user, 380);

    expect(viewModel.nameLine).toBe('Noa, 26');
    expect(viewModel.locationLine).toBe('Kailua · 4 km away');
    expect(viewModel.alignmentLabel).toBe('82% aligned');
    expect(viewModel.compact).toBe(true);
    expect(viewModel.chips).toHaveLength(1);
  });
});
