import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import {
  ProfileDetailActions,
  ProfileDetailHero,
  ProfileDetailInfo,
} from '../features/profile/components/ProfileDetailSections';
import { makeUser, makeUserPhoto, withStoryScreenFrame, withStorySurface } from './support';

function ProfileDetailHeroStory() {
  const user = makeUser({
    firstName: 'Leilani',
    age: 31,
    profile: {
      city: 'Honolulu',
      bio: 'Early riser and distance runner.',
      intentDating: true,
      intentWorkout: true,
      intentFriends: true,
    },
    photos: [
      makeUserPhoto({ id: 'hero-photo', isPrimary: true, sortOrder: 0 }),
      makeUserPhoto({ id: 'hero-photo-2', sortOrder: 1 }),
    ],
    fitnessProfile: {
      intensityLevel: 'moderate',
      weeklyFrequencyBand: '4-5',
      primaryGoal: 'connection',
      favoriteActivities: 'Trail Runs, Coffee Walks, Climbing',
      prefersMorning: true,
      prefersEvening: false,
    },
  });

  return (
    <ProfileDetailHero
      activityTags={['Trail Runs', 'Coffee Walks', 'Climbing']}
      age={user.age}
      city={user.profile?.city}
      firstName={user.firstName}
      intentDisplay="Dating · Training · Friends"
      onBack={() => undefined}
      onBlock={() => undefined}
      onReport={() => undefined}
      photoUri={user.photos?.[0]?.storageKey}
    />
  );
}

function ProfileDetailInfoStory() {
  return (
    <ProfileDetailInfo
      activityTags={['Trail Runs', 'Coffee Walks', 'Climbing']}
      bio="Sunrise movement, low-pressure plans, and good pacing."
      onSuggestActivity={() => undefined}
      structuredRows={[
        { label: 'Pace', value: 'moderate' },
        { label: 'Prefers', value: 'Trail Runs / Coffee Walks' },
        { label: 'Intent', value: 'Dating · Training' },
      ]}
      weeklyFrequencyBand="4-5"
    />
  );
}

function ProfileDetailActionsStory() {
  return (
    <View style={{ height: 220, width: '100%' }}>
      <ProfileDetailActions
        bottomInset={0}
        onLike={() => undefined}
        onPass={() => undefined}
        submitting={false}
      />
    </View>
  );
}

const meta = {
  title: 'Profile/ProfileDetailSections',
  decorators: [withStorySurface({ centered: false, padding: 0 })],
} satisfies Meta<typeof View>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Hero: Story = {
  render: () => <ProfileDetailHeroStory />,
};

export const Info: Story = {
  render: () => <ProfileDetailInfoStory />,
};

export const Actions: Story = {
  render: () => <ProfileDetailActionsStory />,
};

export const Composed: Story = {
  decorators: [withStoryScreenFrame({ centered: false, height: 920, padding: 0 })],
  render: () => (
    <View style={{ flex: 1 }}>
      <ProfileDetailHeroStory />
      <ProfileDetailInfoStory />
      <ProfileDetailActionsStory />
    </View>
  ),
};
