import type { Meta, StoryObj } from '@storybook/react-native';
import { createLocationSuggestion } from '../features/locations/locationSuggestions';
import { ProfileScreenContent } from '../features/profile/components/ProfileScreenContent';
import type { PhotoOperationState } from '../features/profile/hooks/useProfileEditor';
import { makeUser, withStoryScreenFrame } from './support';

function ProfileScreenContentStory({
  editMode = false,
  errorMessage = null,
  isSaving = false,
  photoOperation = null,
  showBuildInfo = false,
}: {
  editMode?: boolean;
  errorMessage?: string | null;
  isSaving?: boolean;
  photoOperation?: PhotoOperationState;
  showBuildInfo?: boolean;
}) {
  const profile = makeUser({
    firstName: 'Lana',
    age: 29,
  });

  return (
    <ProfileScreenContent
      completenessScore={80}
      completenessMissing={[]}
      deletingAccount={false}
      editingPhotos={Boolean(photoOperation)}
      bio={profile.profile?.bio ?? ''}
      city={profile.profile?.city ?? ''}
      editMode={editMode}
      errorMessage={errorMessage}
      intensityLevel={profile.fitnessProfile?.intensityLevel ?? 'moderate'}
      intentDating
      intentFriends={false}
      intentWorkout
      isRefetching={false}
      isSavingFitness={isSaving}
      isSavingProfile={isSaving}
      knownLocationSuggestions={[
        createLocationSuggestion('Honolulu', 'Oahu', 'curated'),
        createLocationSuggestion('Kakaako', 'Honolulu neighborhood', 'curated'),
      ]}
      navigation={{ navigate: () => undefined }}
      onCancelEdit={() => undefined}
      onConfirmDeleteAccount={() => undefined}
      onDeletePhoto={() => undefined}
      onLogout={() => undefined}
      onMakePrimaryPhoto={() => undefined}
      onMovePhotoLeft={() => undefined}
      onMovePhotoRight={() => undefined}
      onRefresh={() => undefined}
      onSave={() => undefined}
      onSelectCitySuggestion={() => undefined}
      onSetBio={() => undefined}
      onSetCity={() => undefined}
      onSetIntensityLevel={() => undefined}
      onSetIntentDating={() => undefined}
      onSetIntentFriends={() => undefined}
      onSetIntentWorkout={() => undefined}
      onSetPrimaryGoal={() => undefined}
      onSetSelectedActivities={() => undefined}
      onSetSelectedSchedule={() => undefined}
      onSetWeeklyFrequencyBand={() => undefined}
      onToggleBuildInfo={() => undefined}
      onUploadPhoto={() => undefined}
      photoOperation={photoOperation}
      primaryGoal={profile.fitnessProfile?.primaryGoal ?? 'connection'}
      profile={profile}
      selectedActivities={['Running', 'Yoga', 'Hiking']}
      selectedSchedule={['Morning', 'Weekends']}
      showBuildInfo={showBuildInfo}
      weeklyFrequencyBand={profile.fitnessProfile?.weeklyFrequencyBand ?? '3-4'}
    />
  );
}

const meta = {
  title: 'Screens/ProfileScreenContent',
  component: ProfileScreenContentStory,
  decorators: [withStoryScreenFrame({ height: 960 })],
} satisfies Meta<typeof ProfileScreenContentStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EditMode: Story = {
  args: {
    editMode: true,
  },
};

export const Saving: Story = {
  args: {
    editMode: true,
    isSaving: true,
  },
};

export const ErrorState: Story = {
  args: {
    errorMessage: 'Could not save profile changes. Try again.',
  },
};

export const UploadingPhoto: Story = {
  args: {
    editMode: true,
    photoOperation: {
      type: 'upload',
      label: 'Uploading photo… 78%',
      progress: 78,
    },
  },
};
