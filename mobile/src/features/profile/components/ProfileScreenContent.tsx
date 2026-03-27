import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import type { ProfileCompletenessMissingItem, User } from '../../../api/types';
import { ScreenScaffold } from '../../../design/primitives';
import { useTheme } from '../../../theme/useTheme';
import { profileStyles as styles } from './profile.styles';
import type { PhotoOperationState } from '../hooks/usePhotoManager';
import { isHapticsEnabled, setHapticsEnabled, loadHapticsPreference } from '../../../lib/interaction/feedback';
import type { LocationSuggestion } from '../../locations/locationSuggestions';
import { ProfileEditBar } from './ProfileEditBar';
import { ProfileHero } from './ProfileHero';
import {
  ProfileBasicsSection,
  ProfileCompletenessSection,
  ProfileDiscoveryPreferenceSection,
  ProfileErrorBanner,
  ProfileFitnessProfileSection,
  ProfileIntentSection,
  ProfileLogoutButton,
  ProfileMovementIdentitySection,
  ProfilePhotosSection,
  ProfileScheduleSection,
} from './ProfileScreenContentSections';
import { ProfileSettingsSection } from './ProfileSettingsSection';

export function ProfileScreenContent({
  completenessEarned,
  completenessScore,
  completenessMissing,
  completenessTotal,
  deletingAccount,
  editingPhotos,
  bio,
  city,
  editMode,
  errorMessage,
  discoveryPreference,
  intensityLevel,
  intentDating,
  intentFriends,
  intentWorkout,
  isRefetching,
  isSavingProfile,
  isSavingFitness,
  knownLocationSuggestions,
  navigation,
  onCancelEdit,
  onConfirmDeleteAccount,
  onDeletePhoto,
  onMakePrimaryPhoto,
  onMovePhotoLeft,
  onMovePhotoRight,
  onRefresh,
  onLogout,
  onSave,
  onSetBio,
  onSetCity,
  onSelectCitySuggestion,
  onSetIntensityLevel,
  onSetIntentDating,
  onSetDiscoveryPreference,
  onSetIntentFriends,
  onSetIntentWorkout,
  onSetPrimaryGoal,
  onSetSelectedActivities,
  onSetSelectedSchedule,
  onSetWeeklyFrequencyBand,
  onToggleBuildInfo,
  onUploadPhoto,
  photoOperation,
  primaryGoal,
  profile,
  selectedActivities,
  selectedSchedule,
  showBuildInfo,
  weeklyFrequencyBand,
}: {
  completenessEarned: number;
  completenessScore: number;
  completenessMissing: ProfileCompletenessMissingItem[];
  completenessTotal: number;
  deletingAccount: boolean;
  editingPhotos: boolean;
  bio: string;
  city: string;
  editMode: boolean;
  errorMessage: string | null;
  discoveryPreference: 'men' | 'women' | 'both';
  intensityLevel: string;
  intentDating: boolean;
  intentFriends: boolean;
  intentWorkout: boolean;
  isRefetching: boolean;
  isSavingProfile: boolean;
  isSavingFitness: boolean;
  knownLocationSuggestions: LocationSuggestion[];
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
  onCancelEdit: () => void;
  onConfirmDeleteAccount: () => void;
  onDeletePhoto: (photoId: string) => void;
  onMakePrimaryPhoto: (photoId: string) => void;
  onMovePhotoLeft: (photoId: string) => void;
  onMovePhotoRight: (photoId: string) => void;
  onRefresh: () => void;
  onLogout: () => void;
  onSave: () => void;
  onSetBio: (value: string) => void;
  onSetCity: (value: string) => void;
  onSelectCitySuggestion: (suggestion: LocationSuggestion) => void;
  onSetIntensityLevel: (value: string) => void;
  onSetIntentDating: (value: boolean) => void;
  onSetDiscoveryPreference: (value: 'men' | 'women' | 'both') => void;
  onSetIntentFriends: (value: boolean) => void;
  onSetIntentWorkout: (value: boolean) => void;
  onSetPrimaryGoal: (value: string) => void;
  onSetSelectedActivities: (value: string) => void;
  onSetSelectedSchedule: (value: string) => void;
  onSetWeeklyFrequencyBand: (value: string) => void;
  onToggleBuildInfo: () => void;
  onUploadPhoto: () => void;
  photoOperation: PhotoOperationState;
  primaryGoal: string;
  profile: User;
  selectedActivities: string[];
  selectedSchedule: string[];
  showBuildInfo: boolean;
  weeklyFrequencyBand: string;
}) {
  const [hapticsOn, setHapticsOn] = useState(isHapticsEnabled);
  const theme = useTheme();

  useEffect(() => {
    loadHapticsPreference().then(setHapticsOn).catch(() => {});
  }, []);

  const handleToggleHaptics = (enabled: boolean) => {
    setHapticsOn(enabled);
    void setHapticsEnabled(enabled);
  };

  const isSaving = isSavingFitness || isSavingProfile;

  return (
    <ScreenScaffold style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={theme.accentPrimary}
          />
        }
      >
        <ProfileHero profile={profile} primaryGoal={primaryGoal} />

        <ProfileCompletenessSection
          completenessEarned={completenessEarned}
          completenessScore={completenessScore}
          completenessMissing={completenessMissing}
          completenessTotal={completenessTotal}
          editMode={editMode}
          onSave={onSave}
        />

        <ProfileEditBar
          editMode={editMode}
          isSaving={isSaving}
          onCancelEdit={onCancelEdit}
          onSave={onSave}
        />

        <ProfileErrorBanner errorMessage={errorMessage} />

        <ProfileBasicsSection
          bio={bio}
          city={city}
          editMode={editMode}
          knownLocationSuggestions={knownLocationSuggestions}
          onSelectCitySuggestion={onSelectCitySuggestion}
          onSetBio={onSetBio}
          onSetCity={onSetCity}
        />

        <ProfileIntentSection
          editMode={editMode}
          intentDating={intentDating}
          intentFriends={intentFriends}
          intentWorkout={intentWorkout}
          onSetIntentDating={onSetIntentDating}
          onSetIntentFriends={onSetIntentFriends}
          onSetIntentWorkout={onSetIntentWorkout}
        />

        <ProfileDiscoveryPreferenceSection
          discoveryPreference={discoveryPreference}
          editMode={editMode}
          onSetDiscoveryPreference={onSetDiscoveryPreference}
        />

        <ProfilePhotosSection
          editMode={editMode}
          editingPhotos={editingPhotos}
          onDeletePhoto={onDeletePhoto}
          onMakePrimaryPhoto={onMakePrimaryPhoto}
          onMovePhotoLeft={onMovePhotoLeft}
          onMovePhotoRight={onMovePhotoRight}
          onUploadPhoto={onUploadPhoto}
          photoOperation={photoOperation}
          profile={profile}
        />

        <ProfileMovementIdentitySection
          editMode={editMode}
          onSetSelectedActivities={onSetSelectedActivities}
          selectedActivities={selectedActivities}
        />

        <ProfileFitnessProfileSection
          editMode={editMode}
          intensityLevel={intensityLevel}
          onSetIntensityLevel={onSetIntensityLevel}
          onSetPrimaryGoal={onSetPrimaryGoal}
          onSetWeeklyFrequencyBand={onSetWeeklyFrequencyBand}
          primaryGoal={primaryGoal}
          weeklyFrequencyBand={weeklyFrequencyBand}
        />

        <ProfileScheduleSection
          editMode={editMode}
          onSetSelectedSchedule={onSetSelectedSchedule}
          selectedSchedule={selectedSchedule}
        />

        <ProfileSettingsSection
          deletingAccount={deletingAccount}
          hapticsOn={hapticsOn}
          navigation={navigation}
          onConfirmDeleteAccount={onConfirmDeleteAccount}
          onToggleBuildInfo={onToggleBuildInfo}
          onToggleHaptics={handleToggleHaptics}
          showBuildInfo={showBuildInfo}
        />

        <ProfileLogoutButton onLogout={onLogout} />
      </ScrollView>
    </ScreenScaffold>
  );
}
