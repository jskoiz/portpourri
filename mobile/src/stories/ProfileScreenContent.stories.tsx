import type { Meta, StoryObj } from '@storybook/react-native';
import type { ProfileCompletenessMissingItem } from '../api/types';
import { createLocationSuggestion } from '../features/locations/locationSuggestions';
import { ProfileScreenContent } from '../features/profile/components/ProfileScreenContent';
import type { PhotoOperationState } from '../features/profile/hooks/usePhotoManager';
import { LOW_CONTRAST_HERO_PHOTO, makeUser, makeUserPhoto, withStoryScreenFrame } from './support';

function ProfileScreenContentStory({
  completenessEarned = 8,
  completenessMissing = [],
  editMode = false,
  errorMessage = null,
  isSaving = false,
  lowContrastHero = false,
  photoOperation = null,
  showBuildInfo = false,
  completenessScore = 100,
  completenessTotal = 8,
}: {
  completenessEarned?: number;
  completenessMissing?: ProfileCompletenessMissingItem[];
  editMode?: boolean;
  errorMessage?: string | null;
  isSaving?: boolean;
  lowContrastHero?: boolean;
  photoOperation?: PhotoOperationState;
  showBuildInfo?: boolean;
  completenessScore?: number;
  completenessTotal?: number;
}) {
  const profile = makeUser({
    firstName: 'Lana',
    age: 29,
    photos: lowContrastHero
      ? [
          makeUserPhoto({
            id: 'photo-1',
            storageKey: LOW_CONTRAST_HERO_PHOTO,
            isPrimary: true,
            sortOrder: 0,
          }),
          makeUserPhoto({ id: 'photo-2', sortOrder: 1 }),
          makeUserPhoto({ id: 'photo-3', sortOrder: 2 }),
        ]
      : undefined,
  });

  return (
    <ProfileScreenContent
      completenessEarned={completenessEarned}
      completenessScore={completenessScore}
      completenessMissing={completenessMissing}
      completenessTotal={completenessTotal}
      deletingAccount={false}
      editingPhotos={Boolean(photoOperation)}
      bio={profile.profile?.bio ?? ''}
      city={profile.profile?.city ?? ''}
      editMode={editMode}
      errorMessage={errorMessage}
      discoveryPreference="both"
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
      onSetDiscoveryPreference={() => undefined}
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

const INCOMPLETE_CHECKLIST_MISSING: ProfileCompletenessMissingItem[] = [
  { field: 'photos', label: 'Add more photos', route: 'EditPhotos' },
  { field: 'availability', label: 'Set your availability', route: 'EditFitness' },
];

export const Default: Story = {};

export const IncompleteChecklist: Story = {
  args: {
    completenessEarned: 6,
    completenessScore: 75,
    completenessTotal: 8,
    completenessMissing: INCOMPLETE_CHECKLIST_MISSING,
  },
};

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

export const LowContrastHero: Story = {
  args: {
    lowContrastHero: true,
  },
};

export const BuildInfoExpanded: Story = {
  args: {
    showBuildInfo: true,
  },
};
