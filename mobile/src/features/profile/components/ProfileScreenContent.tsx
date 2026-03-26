import React from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildInfo } from '../../../config/buildInfo';
import type { ProfileCompletenessMissingItem, User } from '../../../api/types';
import type { LocationSuggestion } from '../../locations/locationSuggestions';
import type { PhotoOperationState } from '../hooks/usePhotoManager';
import { profileStyles as styles } from './profile.styles';
import {
  ProfileBasicsSection,
  ProfileDangerSection,
  ProfileFitnessSection,
  ProfileHeaderSection,
  ProfileHeroSection,
  ProfileIntentSection,
  ProfileMovementSection,
  ProfilePhotosSection,
  ProfileScheduleSection,
  ProfileSettingsSection,
} from './ProfileSections';

const BUILD_ROWS = [
  { label: 'App env', value: buildInfo.appEnv },
  { label: 'Version', value: `${buildInfo.version} (${buildInfo.iosBuildNumber})` },
  { label: 'Branch', value: buildInfo.gitBranch },
  { label: 'Git SHA', value: buildInfo.gitSha },
  { label: 'API URL', value: buildInfo.apiBaseUrl || 'not set' },
  { label: 'Built at', value: buildInfo.buildDate },
  { label: 'Release path', value: buildInfo.releaseMode },
];

export type ProfileScreenEditorViewModel = {
  bio: string;
  city: string;
  editMode: boolean;
  errorMessage: string | null;
  intensityLevel: string;
  intentDating: boolean;
  intentFriends: boolean;
  intentWorkout: boolean;
  isSaving: boolean;
  knownLocationSuggestions: LocationSuggestion[];
  onCancelEdit: () => void;
  onPrimaryAction: () => void;
  onSelectCitySuggestion: (suggestion: LocationSuggestion) => void;
  onSetBio: (value: string) => void;
  onSetCity: (value: string) => void;
  onSetIntensityLevel: (value: string) => void;
  onSetIntentDating: (value: boolean) => void;
  onSetIntentFriends: (value: boolean) => void;
  onSetIntentWorkout: (value: boolean) => void;
  onSetPrimaryGoal: (value: string) => void;
  onSetSelectedActivities: (value: string) => void;
  onSetSelectedSchedule: (value: string) => void;
  onSetWeeklyFrequencyBand: (value: string) => void;
  primaryGoal: string;
  selectedActivities: string[];
  selectedSchedule: string[];
  weeklyFrequencyBand: string;
};

export type ProfileScreenPhotoViewModel = {
  editingPhotos: boolean;
  onDeletePhoto: (photoId: string) => void;
  onMakePrimaryPhoto: (photoId: string) => void;
  onMovePhotoLeft: (photoId: string) => void;
  onMovePhotoRight: (photoId: string) => void;
  onUploadPhoto: () => void;
  photoOperation: PhotoOperationState;
};

export type ProfileScreenSettingsViewModel = {
  hapticsOn: boolean;
  onOpenNotifications: () => void;
  onToggleBuildInfo: () => void;
  onToggleHaptics: (value: boolean) => void;
  showBuildInfo: boolean;
};

export function ProfileScreenContent({
  account,
  completeness,
  editor,
  isRefetching,
  onRefresh,
  photos,
  profile,
  settings,
}: {
  account: {
    deletingAccount: boolean;
    onConfirmDeleteAccount: () => void;
    onLogout: () => void;
  };
  completeness: {
    missing: ProfileCompletenessMissingItem[];
    score: number;
  };
  editor: ProfileScreenEditorViewModel;
  isRefetching: boolean;
  onRefresh: () => void;
  photos: ProfileScreenPhotoViewModel;
  profile: User;
  settings: ProfileScreenSettingsViewModel;
}) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#C4A882" />}
      >
        <ProfileHeroSection profile={profile} primaryGoal={editor.primaryGoal} />
        <ProfileHeaderSection
          completenessMissing={completeness.missing}
          completenessScore={completeness.score}
          editMode={editor.editMode}
          errorMessage={editor.errorMessage}
          isSaving={editor.isSaving}
          onCancelEdit={editor.onCancelEdit}
          onPrimaryAction={editor.onPrimaryAction}
        />
        <ProfileBasicsSection
          bio={editor.bio}
          city={editor.city}
          editMode={editor.editMode}
          knownLocationSuggestions={editor.knownLocationSuggestions}
          onSelectCitySuggestion={editor.onSelectCitySuggestion}
          onSetBio={editor.onSetBio}
          onSetCity={editor.onSetCity}
        />
        <ProfileIntentSection
          editMode={editor.editMode}
          intentDating={editor.intentDating}
          intentFriends={editor.intentFriends}
          intentWorkout={editor.intentWorkout}
          onSetIntentDating={editor.onSetIntentDating}
          onSetIntentFriends={editor.onSetIntentFriends}
          onSetIntentWorkout={editor.onSetIntentWorkout}
        />
        <ProfilePhotosSection
          canEdit={editor.editMode}
          isBusy={photos.editingPhotos}
          onDelete={photos.onDeletePhoto}
          onMakePrimary={photos.onMakePrimaryPhoto}
          onMoveLeft={photos.onMovePhotoLeft}
          onMoveRight={photos.onMovePhotoRight}
          onUpload={photos.onUploadPhoto}
          operation={photos.photoOperation}
          photos={profile.photos ?? []}
        />
        <ProfileMovementSection
          editMode={editor.editMode}
          onSetSelectedActivities={editor.onSetSelectedActivities}
          selectedActivities={editor.selectedActivities}
        />
        <ProfileFitnessSection
          editMode={editor.editMode}
          intensityLevel={editor.intensityLevel}
          onSetIntensityLevel={editor.onSetIntensityLevel}
          onSetPrimaryGoal={editor.onSetPrimaryGoal}
          onSetWeeklyFrequencyBand={editor.onSetWeeklyFrequencyBand}
          primaryGoal={editor.primaryGoal}
          weeklyFrequencyBand={editor.weeklyFrequencyBand}
        />
        <ProfileScheduleSection
          editMode={editor.editMode}
          onSetSelectedSchedule={editor.onSetSelectedSchedule}
          selectedSchedule={editor.selectedSchedule}
        />
        <ProfileSettingsSection
          buildRows={BUILD_ROWS}
          hapticsOn={settings.hapticsOn}
          onOpenNotifications={settings.onOpenNotifications}
          onToggleBuildInfo={settings.onToggleBuildInfo}
          onToggleHaptics={settings.onToggleHaptics}
          showBuildInfo={settings.showBuildInfo}
        />
        <ProfileDangerSection
          deletingAccount={account.deletingAccount}
          onConfirmDeleteAccount={account.onConfirmDeleteAccount}
          onLogout={account.onLogout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
