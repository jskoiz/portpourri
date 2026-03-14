import React from 'react';
import { render } from '@testing-library/react-native';
import SwipeDeck from '../SwipeDeck';

jest.mock('react-native-deck-swiper', () => {
  const React = require('react');
  const { View } = require('react-native');

  return function MockSwiper({
    cards,
    renderCard,
  }: {
    cards: any[];
    renderCard: (card: any) => React.ReactElement;
  }) {
    return (
      <View>
        {cards.map((card: any, i: number) => (
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

  it('renders empty state when data is empty', () => {
    const { getByText } = render(<SwipeDeck data={[]} onSwipeLeft={noop} onSwipeRight={noop} />);
    expect(getByText('No new profiles tonight')).toBeTruthy();
  });

  it('renders cards and tolerates duplicate chip labels from multiple fields', () => {
    const user = {
      id: 'u1',
      firstName: 'Alex',
      fitnessProfile: {
        favoriteActivities: 'cardio',
        primaryGoal: 'cardio',
        weeklyFrequencyBand: 3,
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
        weeklyFrequencyBand: 3,
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
      fitnessProfile: {
        favoriteActivities: 'yoga',
      },
    };

    const { getByText } = render(
      <SwipeDeck data={[user]} onSwipeLeft={noop} onSwipeRight={noop} />,
    );

    expect(getByText('82% aligned')).toBeTruthy();
  });
});
