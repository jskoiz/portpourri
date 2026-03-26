import React from 'react';
import { StatePanel } from '../design/primitives';
import { useProfileScreenController } from '../features/profile/hooks/useProfileScreenController';
import { ProfileScreenContent } from '../features/profile/components/ProfileScreenContent';
import type { MainTabScreenProps } from '../core/navigation/types';

export default function ProfileScreen({ navigation }: MainTabScreenProps<'You'>) {
  const controller = useProfileScreenController();

  if (controller.status.isLoading) return <StatePanel title="Loading your profile" loading />;
  if (controller.status.errorMessage && !controller.profile) {
    return <StatePanel title="Couldn't load profile" description={controller.status.errorMessage} actionLabel="Retry" onAction={controller.actions.onRefresh} isError />;
  }
  if (!controller.profile) {
    return <StatePanel title="No profile found" actionLabel="Refresh" onAction={controller.actions.onRefresh} />;
  }

  return (
    <ProfileScreenContent
      account={controller.account}
      completeness={controller.completeness}
      editor={{
        bio: controller.editor.bio,
        city: controller.editor.city,
        editMode: controller.editor.editMode,
        errorMessage: controller.status.errorMessage,
        intensityLevel: controller.editor.intensityLevel,
        intentDating: controller.editor.intentDating,
        intentFriends: controller.editor.intentFriends,
        intentWorkout: controller.editor.intentWorkout,
        isSaving: controller.status.isSaving,
        knownLocationSuggestions: controller.editor.knownLocationSuggestions,
        onCancelEdit: controller.editor.cancelEdit,
        onPrimaryAction: controller.editor.onPrimaryAction,
        onSelectCitySuggestion: controller.editor.selectCitySuggestion,
        onSetBio: controller.editor.setBio,
        onSetCity: controller.editor.updateCity,
        onSetIntensityLevel: controller.editor.setIntensityLevel,
        onSetIntentDating: controller.editor.setIntentDating,
        onSetIntentFriends: controller.editor.setIntentFriends,
        onSetIntentWorkout: controller.editor.setIntentWorkout,
        onSetPrimaryGoal: controller.editor.setPrimaryGoal,
        onSetSelectedActivities: controller.editor.toggleActivity,
        onSetSelectedSchedule: controller.editor.toggleSchedule,
        onSetWeeklyFrequencyBand: controller.editor.setWeeklyFrequencyBand,
        primaryGoal: controller.editor.primaryGoal,
        selectedActivities: controller.editor.selectedActivities,
        selectedSchedule: controller.editor.selectedSchedule,
        weeklyFrequencyBand: controller.editor.weeklyFrequencyBand,
      }}
      isRefetching={controller.status.isRefetching}
      onRefresh={controller.actions.onRefresh}
      photos={{
        editingPhotos: controller.status.isRefreshingPhotos,
        onDeletePhoto: controller.photos.onDeletePhoto,
        onMakePrimaryPhoto: controller.photos.onMakePrimaryPhoto,
        onMovePhotoLeft: controller.photos.onMovePhotoLeft,
        onMovePhotoRight: controller.photos.onMovePhotoRight,
        onUploadPhoto: controller.photos.onUploadPhoto,
        photoOperation: controller.photos.operation,
      }}
      profile={controller.profile}
      settings={{
        hapticsOn: controller.settings.hapticsOn,
        onOpenNotifications: () => navigation.navigate('Notifications'),
        onToggleBuildInfo: controller.settings.toggleBuildInfo,
        onToggleHaptics: controller.settings.toggleHaptics,
        showBuildInfo: controller.settings.showBuildInfo,
      }}
    />
  );
}
