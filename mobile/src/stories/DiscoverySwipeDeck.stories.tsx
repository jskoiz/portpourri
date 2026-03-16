import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import SwipeDeck from '../components/SwipeDeck';
import { HomeHero } from '../features/discovery/components/HomeHero';
import { HomeQuickFilters } from '../features/discovery/components/HomeQuickFilters';
import type { QuickFilterKey } from '../features/discovery/components/discoveryFilters';

const mockProfiles = [
  {
    id: 'story-1',
    firstName: 'Nia',
    age: 27,
    distanceKm: 5,
    recommendationScore: 88,
    profile: {
      city: 'Manoa',
      bio: 'Trail girl with a soft spot for matcha runs and last-minute waterfall detours.',
      intentDating: true,
      intentWorkout: true,
    },
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
    fitnessProfile: {
      favoriteActivities: 'Hiking, Running, Yoga',
      primaryGoal: 'adventure',
      weeklyFrequencyBand: '3-4',
      intensityLevel: 'INTERMEDIATE',
      prefersMorning: true,
    },
  },
  {
    id: 'story-2',
    firstName: 'Mason',
    age: 30,
    distanceKm: 8,
    profile: {
      city: 'Kakaako',
      bio: 'Beach workouts, compact weekday blocks, and low-pressure coffee after.',
      intentDating: false,
      intentWorkout: true,
    },
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    fitnessProfile: {
      favoriteActivities: 'Running, Boxing',
      primaryGoal: 'strength',
      weeklyFrequencyBand: '4-5',
      intensityLevel: 'ADVANCED',
      prefersEvening: true,
    },
  },
];

const meta = {
  title: 'Discovery/SwipeDeck',
  component: SwipeDeck,
  decorators: [
    (Story) => (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0D1117',
          padding: 24,
        }}
      >
        <View style={{ width: 375, height: 640 }}>
          <Story />
        </View>
      </View>
    ),
  ],
} satisfies Meta<typeof SwipeDeck>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SmallPhonePreview: Story = {
  args: {
    cardHeight: 620,
    data: mockProfiles,
    onPress: () => undefined,
    onSwipeLeft: () => undefined,
    onSwipeRight: () => undefined,
  },
};

export const DiscoveryScreenPreview: Story = {
  args: {
    cardHeight: 620,
    data: mockProfiles,
    onPress: () => undefined,
    onSwipeLeft: () => undefined,
    onSwipeRight: () => undefined,
  },
  render: () => {
    const [activeFilter, setActiveFilter] = React.useState<QuickFilterKey>('all');

    return (
      <View
        style={{
          width: 375,
          height: 780,
          backgroundColor: '#0D1117',
          paddingTop: 16,
        }}
      >
        <HomeHero
          feedCount={17}
          filterCount={1}
          greeting="Evening, Lana"
          intentOption={{ label: 'Open to both', color: '#34D399' }}
          onPressNotifications={() => undefined}
          unreadCount={4}
        />
        <HomeQuickFilters
          activeFilterCount={1}
          activeQuickFilter={activeFilter}
          onPressFilter={setActiveFilter}
          onPressRefine={() => undefined}
        />
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 4, paddingBottom: 8 }}>
          <SwipeDeck
            cardHeight={620}
            data={mockProfiles}
            onPress={() => undefined}
            onSwipeLeft={() => undefined}
            onSwipeRight={() => undefined}
          />
        </View>
        <View style={{ height: 90, backgroundColor: 'rgba(25,32,51,0.92)' }} />
      </View>
    );
  },
};
