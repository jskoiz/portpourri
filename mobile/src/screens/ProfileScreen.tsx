import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StatePanel } from '../design/primitives';
import { normalizeApiError } from '../api/errors';
import { useAuthStore } from '../store/authStore';
import { useProfile } from '../features/profile/hooks/useProfile';
import { useProfileEditor } from '../features/profile/hooks/useProfileEditor';
import { ProfileScreenContent } from '../features/profile/components/ProfileScreenContent';
import type { MainTabScreenProps } from '../core/navigation/types';
import { triggerErrorHaptic } from '../lib/interaction/feedback';

export default function ProfileScreen() {
  const logout = useAuthStore((state) => state.logout);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const navigation = useNavigation<MainTabScreenProps<'You'>['navigation']>();
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
  const editor = useProfileEditor({
    profile,
    refetch,
    updateFitness,
    updateProfile,
    uploadPhoto,
    updatePhoto,
    deletePhoto,
  });

  const errorMessage = editor.error ?? (queryError ? normalizeApiError(queryError).message : null);

  if (isLoading) return <StatePanel title="Loading your profile" loading />;
  if (errorMessage && !profile) {
    return <StatePanel title="Couldn't load profile" description={errorMessage} actionLabel="Retry" onAction={() => { void refetch(); }} isError />;
  }
  if (!profile) {
    return <StatePanel title="No profile found" actionLabel="Refresh" onAction={() => { void refetch(); }} />;
  }

  return (
    <ProfileScreenContent
      deletingAccount={deletingAccount}
      editingPhotos={editor.isEditingPhotos || isUploadingPhoto || isUpdatingPhoto || isDeletingPhoto}
      bio={editor.bio}
      city={editor.city}
      editMode={editor.editMode}
      errorMessage={errorMessage}
      intensityLevel={editor.intensityLevel}
      intentDating={editor.intentDating}
      intentFriends={editor.intentFriends}
      intentWorkout={editor.intentWorkout}
      isRefetching={isRefetching && !isLoading}
      isSavingProfile={isSavingProfile}
      isSavingFitness={isSavingFitness}
      navigation={navigation as any}
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
      onDeletePhoto={(photoId) => { void editor.removePhoto(photoId); }}
      onMakePrimaryPhoto={(photoId) => { void editor.makePrimaryPhoto(photoId); }}
      onMovePhotoLeft={(photoId) => { void editor.movePhotoLeft(photoId); }}
      onMovePhotoRight={(photoId) => { void editor.movePhotoRight(photoId); }}
      onRefresh={() => { void refetch(); }}
      onLogout={() => {
        void logout();
      }}
      onSave={() => { void editor.save(); }}
      onSetBio={editor.setBio}
      onSetCity={editor.updateCity}
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
      onUploadPhoto={() => { void editor.uploadPhoto(); }}
      photoOperation={editor.photoOperation}
      primaryGoal={editor.primaryGoal}
      profile={profile}
      selectedActivities={editor.selectedActivities}
      selectedSchedule={editor.selectedSchedule}
      showBuildInfo={editor.showBuildInfo}
      weeklyFrequencyBand={editor.weeklyFrequencyBand}
    />
  );
}
