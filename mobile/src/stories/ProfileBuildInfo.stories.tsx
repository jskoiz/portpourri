import type { Meta, StoryObj } from '@storybook/react-native';
import { ProfileScreenContent } from '../features/profile/components/ProfileScreenContent';
import { makeUser } from './support';

const meta = {
  title: 'Profile/BuildInfo',
  component: ProfileScreenContent,
  parameters: {
    backgrounds: { default: 'light', values: [{ name: 'light', value: '#FDFBF8' }] },
  },
} satisfies Meta<typeof ProfileScreenContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const profile = makeUser({
  firstName: 'Jordan',
  age: 29,
});

export const Expanded: Story = {
  args: {
    deletingAccount: false,
    onConfirmDeleteAccount: () => undefined,
    onLogout: () => undefined,
    completenessScore: 75,
    completenessMissing: [],
    bio: 'Early starts, surf checks, and low-pressure plans.',
    city: 'Honolulu',
    editMode: false,
    errorMessage: null,
    intensityLevel: 'moderate',
    intentDating: true,
    intentFriends: false,
    intentWorkout: true,
    isSavingProfile: false,
    isSavingFitness: false,
    knownLocationSuggestions: [],
    onCancelEdit: () => undefined,
    onSave: () => undefined,
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
    primaryGoal: 'connection',
    selectedActivities: ['Running', 'Surfing'],
    selectedSchedule: ['Morning'],
    weeklyFrequencyBand: '3-4',
    isRefetching: false,
    onRefresh: () => undefined,
    editingPhotos: false,
    onDeletePhoto: () => undefined,
    onMakePrimaryPhoto: () => undefined,
    onMovePhotoLeft: () => undefined,
    onMovePhotoRight: () => undefined,
    onUploadPhoto: () => undefined,
    photoOperation: null,
    navigation: { navigate: () => undefined },
    profile,
    onToggleBuildInfo: () => undefined,
    showBuildInfo: true,
  },
};
