import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ProfileScreenContent } from '../ProfileScreenContent';
import type { User } from '../../../../api/types';

const mockLoadHapticsPreference = jest.fn();
const mockSetHapticsEnabled = jest.fn();

jest.mock('expo-image', () => ({
  Image: ({ accessibilityLabel }: { accessibilityLabel?: string }) => {
    const { View } = require('react-native');
    return <View accessibilityLabel={accessibilityLabel} />;
  },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('../../../../config/buildInfo', () => ({
  buildInfo: {
    appEnv: 'test',
    apiBaseUrl: 'https://api.example.test',
    version: '1.2.3',
    iosBuildNumber: '42',
    androidVersionCode: '77',
    gitBranch: 'codex/profile-screen',
    gitSha: 'abc123def456',
    gitShortSha: 'abc123d',
    buildDate: '2026-03-25T12:00:00Z',
    buildDateSource: 'scripted',
    releaseMode: 'simulator',
    releaseProfile: 'device-qa',
    provenanceSource: 'scripted-release',
  },
}));

jest.mock('../../../../lib/interaction/feedback', () => ({
  isHapticsEnabled: () => true,
  loadHapticsPreference: (...args: unknown[]) => {
    mockLoadHapticsPreference(...args);
    return Promise.resolve(true);
  },
  triggerLightImpactHaptic: () => Promise.resolve(),
  triggerSelectionHaptic: () => Promise.resolve(),
  setHapticsEnabled: (...args: unknown[]) => {
    mockSetHapticsEnabled(...args);
    return Promise.resolve();
  },
}));

function makeProfile(): User {
  return {
    id: 'user-1',
    firstName: 'Kai',
    age: 29,
    photoUrl: undefined,
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
  const navigation = { navigate: jest.fn() };
  const onLogout = jest.fn();
  const onToggleBuildInfo = jest.fn();
  const Wrapper = () => {
    const [showBuildInfo, setShowBuildInfo] = React.useState(false);

    return (
      <ProfileScreenContent
        completenessScore={100}
        completenessMissing={[]}
        deletingAccount={false}
        editingPhotos={false}
        bio="Training for the next sunrise session."
        city="Honolulu"
        editMode={false}
        errorMessage={null}
        intensityLevel="moderate"
        intentDating
        intentFriends={false}
        intentWorkout
        isRefetching={false}
        isSavingProfile={false}
        isSavingFitness={false}
        knownLocationSuggestions={[]}
        navigation={navigation}
        onCancelEdit={jest.fn()}
        onConfirmDeleteAccount={jest.fn()}
        onDeletePhoto={jest.fn()}
        onMakePrimaryPhoto={jest.fn()}
        onMovePhotoLeft={jest.fn()}
        onMovePhotoRight={jest.fn()}
        onRefresh={jest.fn()}
        onLogout={onLogout}
        onSave={jest.fn()}
        onSetBio={jest.fn()}
        onSetCity={jest.fn()}
        onSelectCitySuggestion={jest.fn()}
        onSetIntensityLevel={jest.fn()}
        onSetIntentDating={jest.fn()}
        onSetIntentFriends={jest.fn()}
        onSetIntentWorkout={jest.fn()}
        onSetPrimaryGoal={jest.fn()}
        onSetSelectedActivities={jest.fn()}
        onSetSelectedSchedule={jest.fn()}
        onSetWeeklyFrequencyBand={jest.fn()}
        onToggleBuildInfo={() => {
          onToggleBuildInfo();
          setShowBuildInfo((current) => !current);
        }}
        onUploadPhoto={jest.fn()}
        photoOperation={null}
        primaryGoal="health"
        profile={makeProfile()}
        selectedActivities={['running']}
        selectedSchedule={['Morning']}
        showBuildInfo={showBuildInfo}
        weeklyFrequencyBand="3-4"
        {...overrides}
      />
    );
  };

  return {
    navigation,
    onLogout,
    onToggleBuildInfo,
    ...render(<Wrapper />),
  };
}

describe('ProfileScreenContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens build provenance details and routes to notifications', async () => {
    const { navigation } = renderContent();

    expect(screen.getByText('Kai, 29')).toBeTruthy();
    expect(screen.getByLabelText('🏃 Running')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Build provenance'));

    expect(screen.getByTestId('build-provenance-panel')).toBeTruthy();
    expect(screen.getByText('App env')).toBeTruthy();
    expect(screen.getByText('test')).toBeTruthy();
    expect(screen.getByText('Version')).toBeTruthy();
    expect(screen.getByText('1.2.3 (42)')).toBeTruthy();
    expect(screen.getByText('Branch')).toBeTruthy();
    expect(screen.getByText('codex/profile-screen')).toBeTruthy();
    expect(screen.getByText('Git SHA')).toBeTruthy();
    expect(screen.getByText('abc123def456')).toBeTruthy();
    expect(screen.getByText('API URL')).toBeTruthy();
    expect(screen.getByText('https://api.example.test')).toBeTruthy();
    expect(screen.getByText('Built at')).toBeTruthy();
    expect(screen.getByText('2026-03-25T12:00:00Z')).toBeTruthy();
    expect(screen.getByText('Release path')).toBeTruthy();
    expect(screen.getByText('simulator')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Notifications'));

    expect(navigation.navigate).toHaveBeenCalledWith('Notifications');
  });

  it('loads and toggles the haptic preference and logs out', async () => {
    const { onLogout, onToggleBuildInfo, navigation } = renderContent();

    await waitFor(() => expect(mockLoadHapticsPreference).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('haptic-feedback-toggle-switch').props.value).toBe(true);

    fireEvent(screen.getByTestId('haptic-feedback-toggle-switch'), 'valueChange', false);

    expect(mockSetHapticsEnabled).toHaveBeenCalledWith(false);

    fireEvent.press(screen.getByLabelText('Log out'));

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(onToggleBuildInfo).not.toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalledWith('Notifications');
  });
});
