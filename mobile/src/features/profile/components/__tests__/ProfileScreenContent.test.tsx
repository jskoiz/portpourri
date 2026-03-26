import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ProfileScreenContent } from '../ProfileScreenContent';
import type { User } from '../../../../api/types';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

function makeProfile(): User {
  return {
    id: 'user-1',
    firstName: 'Kai',
    age: 29,
    profile: {
      city: 'Honolulu',
      bio: 'Training for the next sunrise session.',
      intentDating: true,
      intentWorkout: true,
      intentFriends: false,
    },
    fitnessProfile: {
      intensityLevel: 'moderate',
      weeklyFrequencyBand: '3-4',
      primaryGoal: 'health',
      favoriteActivities: 'Running',
      prefersMorning: true,
      prefersEvening: false,
    },
    photos: [],
  };
}

function renderContent(overrides: Partial<React.ComponentProps<typeof ProfileScreenContent>> = {}) {
  const onLogout = jest.fn();
  const onOpenNotifications = jest.fn();

  render(
    <ProfileScreenContent
      account={{
        deletingAccount: false,
        onConfirmDeleteAccount: jest.fn(),
        onLogout,
      }}
      completeness={{
        missing: [],
        score: 100,
      }}
      editor={{
        bio: 'Training for the next sunrise session.',
        city: 'Honolulu',
        editMode: false,
        errorMessage: null,
        intensityLevel: 'moderate',
        intentDating: true,
        intentFriends: false,
        intentWorkout: true,
        isSaving: false,
        knownLocationSuggestions: [],
        onCancelEdit: jest.fn(),
        onPrimaryAction: jest.fn(),
        onSelectCitySuggestion: jest.fn(),
        onSetBio: jest.fn(),
        onSetCity: jest.fn(),
        onSetIntensityLevel: jest.fn(),
        onSetIntentDating: jest.fn(),
        onSetIntentFriends: jest.fn(),
        onSetIntentWorkout: jest.fn(),
        onSetPrimaryGoal: jest.fn(),
        onSetSelectedActivities: jest.fn(),
        onSetSelectedSchedule: jest.fn(),
        onSetWeeklyFrequencyBand: jest.fn(),
        primaryGoal: 'health',
        selectedActivities: ['Running'],
        selectedSchedule: ['Morning'],
        weeklyFrequencyBand: '3-4',
      }}
      isRefetching={false}
      onRefresh={jest.fn()}
      photos={{
        editingPhotos: false,
        onDeletePhoto: jest.fn(),
        onMakePrimaryPhoto: jest.fn(),
        onMovePhotoLeft: jest.fn(),
        onMovePhotoRight: jest.fn(),
        onUploadPhoto: jest.fn(),
        photoOperation: null,
      }}
      profile={makeProfile()}
      settings={{
        hapticsOn: true,
        onOpenNotifications,
        onToggleBuildInfo: jest.fn(),
        onToggleHaptics: jest.fn(),
        showBuildInfo: true,
      }}
      {...overrides}
    />,
  );

  return {
    onLogout,
    onOpenNotifications,
  };
}

describe('ProfileScreenContent', () => {
  it('renders grouped sections and routes notifications through settings actions', () => {
    const { onOpenNotifications, onLogout } = renderContent();

    expect(screen.getByText('Kai, 29')).toBeTruthy();
    expect(screen.getByText('Movement Identity')).toBeTruthy();
    expect(screen.getByText('Build provenance')).toBeTruthy();
    expect(screen.getByTestId('build-provenance-panel')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Notifications'));
    fireEvent.press(screen.getByLabelText('Log out'));

    expect(onOpenNotifications).toHaveBeenCalledTimes(1);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
