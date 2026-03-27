import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Screen, StatePanel } from '../design/primitives';
import { normalizeApiError } from '../api/errors';
import { useAuthStore } from '../store/authStore';
import { useProfile } from '../features/profile/hooks/useProfile';
import { useProfileCompleteness } from '../features/profile/hooks/useProfileCompleteness';
import { useProfileEditor } from '../features/profile/hooks/useProfileEditor';
import { usePhotoManager } from '../features/profile/hooks/usePhotoManager';
import { ProfileScreenContent } from '../features/profile/components/ProfileScreenContent';
import { useKnownLocationSuggestions } from '../features/locations/useKnownLocationSuggestions';
import type { MainTabScreenProps } from '../core/navigation/types';
import { triggerErrorHaptic } from '../lib/interaction/feedback';
import { useTheme } from '../theme/useTheme';

export default function ProfileScreen({ navigation }: MainTabScreenProps<'You'>) {
  const theme = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const {
    error: queryError,
    isLoading,
    isRefetching,
    profile,
    refetch,
    updateFitness,
    updateProfile,
    uploadPhoto,
    updatePhoto,
    deletePhoto,
    isSavingFitness,
    isSavingProfile,
    isUploadingPhoto,
    isUpdatingPhoto,
    isDeletingPhoto,
  } = useProfile();
  const [deletingAccount, setDeletingAccount] = useState(false);
  const {
    earned: completenessEarned,
    score: completenessScore,
    missing: completenessMissing,
    total: completenessTotal,
  } = useProfileCompleteness();
  const knownLocationSuggestions = useKnownLocationSuggestions();
  const editor = useProfileEditor({
    profile,
    updateFitness,
    updateProfile,
  });
  const photos = usePhotoManager({
    profile,
    refetch,
    uploadPhoto,
    updatePhoto,
    deletePhoto,
    setError: editor.setError,
  });

  const errorMessage = editor.error ?? (queryError ? normalizeApiError(queryError).message : null);

  if (isLoading) {
    return (
      <Screen backgroundColor={theme.background}>
        <StatePanel title="Loading your profile" loading />
      </Screen>
    );
  }
  if (errorMessage && !profile) {
    return (
      <Screen backgroundColor={theme.background}>
        <StatePanel
          title="Couldn't load profile"
          description={errorMessage}
          actionLabel="Retry"
          onAction={() => {
            void refetch();
          }}
          isError
        />
      </Screen>
    );
  }
  if (!profile) {
    return (
      <Screen backgroundColor={theme.background}>
        <StatePanel
          title="No profile found"
          actionLabel="Refresh"
          onAction={() => {
            void refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <ProfileScreenContent
      completenessEarned={completenessEarned}
      completenessScore={completenessScore}
      completenessMissing={completenessMissing}
      completenessTotal={completenessTotal}
      deletingAccount={deletingAccount}
      editingPhotos={photos.isEditingPhotos || isUploadingPhoto || isUpdatingPhoto || isDeletingPhoto}
      bio={editor.bio}
      city={editor.city}
      editMode={editor.editMode}
      errorMessage={errorMessage}
      discoveryPreference={editor.discoveryPreference}
      intensityLevel={editor.intensityLevel}
      intentDating={editor.intentDating}
      intentFriends={editor.intentFriends}
      intentWorkout={editor.intentWorkout}
      isRefetching={isRefetching && !isLoading}
      isSavingProfile={isSavingProfile}
      isSavingFitness={isSavingFitness}
      knownLocationSuggestions={knownLocationSuggestions}
      navigation={navigation}
      onCancelEdit={editor.cancelEdit}
      onConfirmDeleteAccount={() => {
        if (deletingAccount) return;
        Alert.alert(
          'Delete account?',
          'This permanently removes your profile, matches, messages, event RSVPs, and saved session.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete account',
              style: 'destructive',
              onPress: async () => {
                setDeletingAccount(true);
                editor.setError(null);
                try {
                  await deleteAccount();
                } catch (err) {
                  void triggerErrorHaptic();
                  editor.setError(normalizeApiError(err).message);
                } finally {
                  setDeletingAccount(false);
                }
              },
            },
          ],
        );
      }}
      onDeletePhoto={(photoId) => { void photos.removePhoto(photoId); }}
      onMakePrimaryPhoto={(photoId) => { void photos.makePrimaryPhoto(photoId); }}
      onMovePhotoLeft={(photoId) => { void photos.movePhotoLeft(photoId); }}
      onMovePhotoRight={(photoId) => { void photos.movePhotoRight(photoId); }}
      onRefresh={() => { void refetch(); }}
      onLogout={() => {
        void logout();
      }}
      onSave={() => { void editor.save(); }}
      onSetBio={editor.setBio}
      onSetCity={editor.updateCity}
      onSetDiscoveryPreference={editor.setDiscoveryPreference}
      onSelectCitySuggestion={editor.selectCitySuggestion}
      onSetIntensityLevel={editor.setIntensityLevel}
      onSetIntentDating={editor.setIntentDating}
      onSetIntentFriends={editor.setIntentFriends}
      onSetIntentWorkout={editor.setIntentWorkout}
      onSetPrimaryGoal={editor.setPrimaryGoal}
      onSetSelectedActivities={editor.toggleActivity}
      onSetSelectedSchedule={editor.toggleSchedule}
      onSetWeeklyFrequencyBand={editor.setWeeklyFrequencyBand}
      onToggleBuildInfo={() => editor.setShowBuildInfo((current) => !current)}
      onUploadPhoto={() => { void photos.uploadPhoto(); }}
      photoOperation={photos.photoOperation}
      primaryGoal={editor.primaryGoal}
      profile={profile}
      selectedActivities={editor.selectedActivities}
      selectedSchedule={editor.selectedSchedule}
      showBuildInfo={editor.showBuildInfo}
      weeklyFrequencyBand={editor.weeklyFrequencyBand}
    />
  );
}
