import React from 'react';
import { Screen, StatePanel } from '../design/primitives';
import { normalizeApiError } from '../api/errors';
import { useProfile } from '../features/profile/hooks/useProfile';
import { useProfileCompleteness } from '../features/profile/hooks/useProfileCompleteness';
import { useProfileEditor } from '../features/profile/hooks/useProfileEditor';
import { usePhotoManager } from '../features/profile/hooks/usePhotoManager';
import { useKnownLocationSuggestions } from '../features/locations/useKnownLocationSuggestions';
import { ProfilePreview } from '../features/profile/components/ProfilePreview';
import type { MainTabScreenProps } from '../core/navigation/types';
import { useTheme } from '../theme/useTheme';

export default function ProfileScreen({ navigation }: MainTabScreenProps<'You'>) {
  const theme = useTheme();
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
          onAction={() => { void refetch(); }}
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
          onAction={() => { void refetch(); }}
        />
      </Screen>
    );
  }

  return (
    <ProfilePreview
      completenessEarned={completenessEarned}
      completenessScore={completenessScore}
      completenessMissing={completenessMissing}
      completenessTotal={completenessTotal}
      bio={editor.bio}
      city={editor.city}
      discoveryPreference={editor.discoveryPreference}
      editingPhotos={photos.isEditingPhotos || isUploadingPhoto || isUpdatingPhoto || isDeletingPhoto}
      intensityLevel={editor.intensityLevel}
      intentDating={editor.intentDating}
      intentFriends={editor.intentFriends}
      intentWorkout={editor.intentWorkout}
      isRefetching={isRefetching && !isLoading}
      isSavingFitness={isSavingFitness}
      isSavingProfile={isSavingProfile}
      knownLocationSuggestions={knownLocationSuggestions}
      onDeletePhoto={(photoId) => { void photos.removePhoto(photoId); }}
      onMakePrimaryPhoto={(photoId) => { void photos.makePrimaryPhoto(photoId); }}
      onMovePhotoLeft={(photoId) => { void photos.movePhotoLeft(photoId); }}
      onMovePhotoRight={(photoId) => { void photos.movePhotoRight(photoId); }}
      onNavigateSettings={() => navigation.navigate('Settings')}
      onRefresh={() => { void refetch(); }}
      onSaveBio={() => editor.saveBio()}
      onSaveFitness={() => editor.saveFitness()}
      onSaveIntent={() => editor.saveIntent()}
      onSelectCitySuggestion={editor.selectCitySuggestion}
      onSetBio={editor.setBio}
      onSetCity={editor.updateCity}
      onSetIntensityLevel={editor.setIntensityLevel}
      onSetIntentDating={editor.setIntentDating}
      onSetIntentFriends={editor.setIntentFriends}
      onSetIntentWorkout={editor.setIntentWorkout}
      onSetPrimaryGoal={editor.setPrimaryGoal}
      onSetSelectedActivities={editor.toggleActivity}
      onSetSelectedSchedule={editor.toggleSchedule}
      onSetWeeklyFrequencyBand={editor.setWeeklyFrequencyBand}
      onUploadPhoto={() => { void photos.uploadPhoto(); }}
      photoOperation={photos.photoOperation}
      primaryGoal={editor.primaryGoal}
      profile={profile}
      selectedActivities={editor.selectedActivities}
      selectedSchedule={editor.selectedSchedule}
      weeklyFrequencyBand={editor.weeklyFrequencyBand}
    />
  );
}
