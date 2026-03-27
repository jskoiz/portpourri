import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import SwipeDeck from '../SwipeDeck';
import {
  buildSwipeDeckCardViewModel,
  clampCardHeight,
} from '../swipeDeck/swipeDeck.presentation';

let onSwipedAllCallback: (() => void) | null = null;
let latestSwiperProps: Record<string, unknown> | null = null;

jest.mock('react-native-deck-swiper', () => {
  const React = require('react');
  const { Text, View } = require('react-native');

  return function MockSwiper(props: {
    cards: unknown[];
    cardStyle?: { height?: number };
    onSwipedAll?: () => void;
    renderCard: (card: unknown) => React.ReactElement;
  }) {
    const { cards, cardStyle, renderCard, onSwipedAll } = props;
    const [initialHeight] = React.useState(cardStyle?.height);
    onSwipedAllCallback = onSwipedAll || null;
    latestSwiperProps = props;

    return (
      <View>
        <Text>{`swiper-height-${initialHeight}`}</Text>
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

jest.mock('expo-image', () => {
  const React = require('react');
  const { Pressable } = require('react-native');

  return {
    Image: ({
      accessibilityLabel,
      onError,
    }: {
      accessibilityLabel?: string;
      onError?: () => void;
    }) => (
      <Pressable
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        onPress={() => onError?.()}
      />
    ),
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

    expect(getByText('Looking for a training partner')).toBeTruthy();
  });

  it('shows a friends badge when discovery intent is friends-only', () => {
    const user = {
      id: 'u6b',
      firstName: 'Skye',
      profile: {
        intentDating: false,
        intentWorkout: false,
        intentFriends: true,
      },
    };

    const { getByText } = render(
      <SwipeDeck data={[user]} onSwipeLeft={noop} onSwipeRight={noop} />,
    );

    expect(getByText('Open to friendship')).toBeTruthy();
  });

  it('avoids stacking two evening-oriented labels in the top summary', () => {
    const user = {
      id: 'u6c',
      firstName: 'Noa',
      profile: {
        city: 'Honolulu',
        intentDating: true,
      },
      fitnessProfile: {
        prefersEvening: true,
      },
    };

    const { getByText, queryByText } = render(
      <SwipeDeck data={[user]} onSwipeLeft={noop} onSwipeRight={noop} />,
    );

    expect(getByText('Open to dating')).toBeTruthy();
    expect(getByText('Open to local plans')).toBeTruthy();
    expect(queryByText('Available tonight')).toBeNull();
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

  it('falls back to the placeholder when the primary photo fails to load', () => {
    const user = {
      id: 'u7b',
      firstName: 'Quentin',
      photos: [
        {
          id: 'photo-missing',
          storageKey: 'https://images.example.com/missing.jpg',
          isPrimary: true,
          isHidden: false,
          sortOrder: 0,
        },
      ],
    };

    const { getByLabelText, getByText } = render(
      <SwipeDeck data={[user]} onSwipeLeft={noop} onSwipeRight={noop} />,
    );

    fireEvent.press(getByLabelText('Photo of Quentin'));

    expect(getByText('Q')).toBeTruthy();
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

  it('reinitializes the swiper when the resolved card height changes', () => {
    const user = { id: 'u10', firstName: 'Ari' };
    const { getByText, rerender } = render(
      <SwipeDeck data={[user]} cardHeight={520} onSwipeLeft={noop} onSwipeRight={noop} />,
    );

    expect(getByText('swiper-height-520')).toBeTruthy();

    rerender(
      <SwipeDeck data={[user]} cardHeight={440} onSwipeLeft={noop} onSwipeRight={noop} />,
    );

    expect(getByText('swiper-height-440')).toBeTruthy();
  });
});

describe('swipe deck presentation helpers', () => {
  it('clamps card height to allowed range with a sane default', () => {
    expect(clampCardHeight()).toBe(520);
    expect(clampCardHeight(Number.NaN)).toBe(520);
    expect(clampCardHeight(100)).toBe(300);
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
