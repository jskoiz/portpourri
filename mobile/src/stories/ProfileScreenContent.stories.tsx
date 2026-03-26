import type { Meta, StoryObj } from '@storybook/react-native';
import { createLocationSuggestion } from '../features/locations/locationSuggestions';
import { ProfileScreenContent } from '../features/profile/components/ProfileScreenContent';
import type { PhotoOperationState } from '../features/profile/hooks/usePhotoManager';
import { LOW_CONTRAST_HERO_PHOTO, makeUser, makeUserPhoto, withStoryScreenFrame } from './support';

function ProfileScreenContentStory({
  editMode = false,
  errorMessage = null,
  isSaving = false,
  lowContrastHero = false,
  photoOperation = null,
  showBuildInfo = false,
}: {
  editMode?: boolean;
  errorMessage?: string | null;
  isSaving?: boolean;
  lowContrastHero?: boolean;
  photoOperation?: PhotoOperationState;
  showBuildInfo?: boolean;
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
      account={{
        deletingAccount: false,
        onConfirmDeleteAccount: () => undefined,
        onLogout: () => undefined,
      }}
      completeness={{
        score: 80,
        missing: [],
      }}
      editor={{
        bio: profile.profile?.bio ?? '',
        city: profile.profile?.city ?? '',
        editMode,
        errorMessage,
        intensityLevel: profile.fitnessProfile?.intensityLevel ?? 'moderate',
        intentDating: true,
        intentFriends: false,
        intentWorkout: true,
        isSaving,
        knownLocationSuggestions: [
          createLocationSuggestion('Honolulu', 'Oahu', 'curated'),
          createLocationSuggestion('Kakaako', 'Honolulu neighborhood', 'curated'),
        ],
        onCancelEdit: () => undefined,
        onPrimaryAction: () => undefined,
        onSelectCitySuggestion: () => undefined,
        onSetBio: () => undefined,
        onSetCity: () => undefined,
        onSetIntensityLevel: () => undefined,
        onSetIntentDating: () => undefined,
        onSetIntentFriends: () => undefined,
        onSetIntentWorkout: () => undefined,
        onSetPrimaryGoal: () => undefined,
        onSetSelectedActivities: () => undefined,
        onSetSelectedSchedule: () => undefined,
        onSetWeeklyFrequencyBand: () => undefined,
        primaryGoal: profile.fitnessProfile?.primaryGoal ?? 'connection',
        selectedActivities: ['Running', 'Yoga', 'Hiking'],
        selectedSchedule: ['Morning', 'Weekends'],
        weeklyFrequencyBand: profile.fitnessProfile?.weeklyFrequencyBand ?? '3-4',
      }}
      isRefetching={false}
      onRefresh={() => undefined}
      photos={{
        editingPhotos: Boolean(photoOperation),
        onDeletePhoto: () => undefined,
        onMakePrimaryPhoto: () => undefined,
        onMovePhotoLeft: () => undefined,
        onMovePhotoRight: () => undefined,
        onUploadPhoto: () => undefined,
        photoOperation,
      }}
      profile={profile}
      settings={{
        hapticsOn: true,
        onOpenNotifications: () => undefined,
        onToggleBuildInfo: () => undefined,
        onToggleHaptics: () => undefined,
        showBuildInfo,
      }}
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

export const PartialSaveError: Story = {
  args: {
    editMode: true,
    errorMessage: 'Profile basics were saved, but fitness settings could not be saved. Please try again.',
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

export const PhotoBusy: Story = {
  args: {
    editMode: true,
    photoOperation: {
      type: 'reorder',
      photoId: 'photo-2',
      label: 'Reordering photos…',
    },
  },
};
