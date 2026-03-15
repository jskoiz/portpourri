import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { ProfileScreenContent } from '../features/profile/components/ProfileScreenContent';

const meta = {
  title: 'Profile/BuildInfo',
  component: ProfileScreenContent,
} satisfies Meta<typeof ProfileScreenContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {
  args: {
    deletingAccount: false,
    editMode: false,
    errorMessage: null,
    intensityLevel: 'moderate',
    isRefetching: false,
    isSavingFitness: false,
    navigation: { navigate: () => undefined },
    onCancelEdit: () => undefined,
    onConfirmDeleteAccount: () => undefined,
    onLogout: () => undefined,
    onRefresh: () => undefined,
    onSave: () => undefined,
    onSetIntensityLevel: () => undefined,
    onSetPrimaryGoal: () => undefined,
    onSetSelectedActivities: () => undefined,
    onSetSelectedSchedule: () => undefined,
    onSetWeeklyFrequencyBand: () => undefined,
    onToggleBuildInfo: () => undefined,
    primaryGoal: 'connection',
    profile: {
      id: 'user-1',
      firstName: 'Jordan',
      age: 29,
      profile: { city: 'Honolulu' },
      fitnessProfile: {
        intensityLevel: 'moderate',
        weeklyFrequencyBand: '3-4',
        primaryGoal: 'connection',
        favoriteActivities: 'Running, Surfing',
        prefersMorning: true,
        prefersEvening: false,
      },
      photos: [],
    } as any,
    selectedActivities: ['Running', 'Surfing'],
    selectedSchedule: ['Morning'],
    showBuildInfo: true,
    weeklyFrequencyBand: '3-4',
  },
};
