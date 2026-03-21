import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import type { User } from '../../../api/types';
import { normalizeApiError } from '../../../api/errors';
import { normalizeIntensityLevelForForm } from '../../../api/profileIntensity';
import type { LocationSuggestion } from '../../locations/locationSuggestions';
import { triggerErrorHaptic, triggerSelectionHaptic, triggerSuccessHaptic } from '../../../lib/interaction/feedback';
import { buildSchedulePreferences, parseFavoriteActivities } from '../components/profile.helpers';
import { buildPhotoReorderPlan } from './profilePhotoHelpers';

function toggleValue(values: string[], nextValue: string) {
  return values.includes(nextValue)
    ? values.filter((value) => value !== nextValue)
    : [...values, nextValue];
}

export type PhotoOperationState =
  | { type: 'upload'; label: string; progress: number; photoId?: undefined }
  | { type: 'primary' | 'delete' | 'reorder'; label: string; photoId: string; progress?: undefined }
  | null;

export function useProfileEditor({
  profile,
  refetch,
  updateFitness,
  updateProfile,
  uploadPhoto,
  updatePhoto,
  deletePhoto,
}: {
  profile: User | null;
  refetch: () => Promise<unknown>;
  updateFitness: (payload: {
    intensityLevel: string;
    weeklyFrequencyBand: string;
    primaryGoal: string;
    favoriteActivities: string;
    prefersMorning?: boolean;
    prefersEvening?: boolean;
  }) => Promise<unknown>;
  updateProfile: (payload: {
    bio?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    intentDating?: boolean;
    intentWorkout?: boolean;
    intentFriends?: boolean;
  }) => Promise<unknown>;
  uploadPhoto: (payload: {
    uri: string;
    mimeType?: string | null;
    fileName?: string | null;
    onProgress?: (progress: number) => void;
  }) => Promise<unknown>;
  updatePhoto: (payload: { photoId: string; payload: { isPrimary?: boolean; sortOrder?: number } }) => Promise<unknown>;
  deletePhoto: (photoId: string) => Promise<unknown>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showBuildInfo, setShowBuildInfo] = useState(false);
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [citySelection, setCitySelection] = useState<Pick<LocationSuggestion, 'latitude' | 'longitude'> | null>(null);
  const [intensityLevel, setIntensityLevel] = useState('');
  const [intentDating, setIntentDating] = useState(false);
  const [intentWorkout, setIntentWorkout] = useState(false);
  const [intentFriends, setIntentFriends] = useState(false);
  const [weeklyFrequencyBand, setWeeklyFrequencyBand] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string[]>([]);
  const [photoOperation, setPhotoOperation] = useState<PhotoOperationState>(null);

  useEffect(() => {
    if (!profile) return;
    setBio(profile.profile?.bio || '');
    setCity(profile.profile?.city || '');
    setCitySelection({
      latitude: profile.profile?.latitude,
      longitude: profile.profile?.longitude,
    });
    setIntensityLevel(normalizeIntensityLevelForForm(profile.fitnessProfile?.intensityLevel));
    setIntentDating(Boolean(profile.profile?.intentDating));
    setIntentWorkout(Boolean(profile.profile?.intentWorkout));
    setIntentFriends(Boolean(profile.profile?.intentFriends));
    setWeeklyFrequencyBand(profile.fitnessProfile?.weeklyFrequencyBand || '');
    setPrimaryGoal(profile.fitnessProfile?.primaryGoal || '');
    setSelectedActivities(parseFavoriteActivities(profile.fitnessProfile?.favoriteActivities));
    setSelectedSchedule(buildSchedulePreferences(profile.fitnessProfile));
  }, [profile]);

  const resetFromProfile = () => {
    if (!profile) return;
    setBio(profile.profile?.bio || '');
    setCity(profile.profile?.city || '');
    setCitySelection({
      latitude: profile.profile?.latitude,
      longitude: profile.profile?.longitude,
    });
    setIntensityLevel(normalizeIntensityLevelForForm(profile.fitnessProfile?.intensityLevel));
    setIntentDating(Boolean(profile.profile?.intentDating));
    setIntentWorkout(Boolean(profile.profile?.intentWorkout));
    setIntentFriends(Boolean(profile.profile?.intentFriends));
    setWeeklyFrequencyBand(profile.fitnessProfile?.weeklyFrequencyBand || '');
    setPrimaryGoal(profile.fitnessProfile?.primaryGoal || '');
    setSelectedActivities(parseFavoriteActivities(profile.fitnessProfile?.favoriteActivities));
    setSelectedSchedule(buildSchedulePreferences(profile.fitnessProfile));
  };

  const save = async () => {
    if (!editMode) {
      setEditMode(true);
      return;
    }

    setError(null);
    try {
      await updateProfile({
        bio: bio.trim(),
        city: city.trim(),
        latitude: citySelection?.latitude,
        longitude: citySelection?.longitude,
        intentDating,
        intentWorkout,
        intentFriends,
      });
      await updateFitness({
        intensityLevel,
        weeklyFrequencyBand,
        primaryGoal,
        favoriteActivities: selectedActivities.join(', '),
        prefersMorning: selectedSchedule.includes('Morning'),
        prefersEvening: selectedSchedule.includes('Evening'),
      });
      void triggerSuccessHaptic();
      setEditMode(false);
      await refetch();
    } catch (err) {
      void triggerErrorHaptic();
      setError(normalizeApiError(err).message);
    }
  };

  const pickAndUploadPhoto = async () => {
    setError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Photo library permission is required to upload photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.72,
      });
      if (result.canceled || !result.assets.length) return;
      const asset = result.assets[0];
      setPhotoOperation({ type: 'upload', label: 'Uploading photo…', progress: 5 });
      await uploadPhoto({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        onProgress: (progress) => {
          setPhotoOperation({
            type: 'upload',
            label: progress >= 100 ? 'Finalizing photo…' : `Uploading photo… ${progress}%`,
            progress,
          });
        },
      });
      void triggerSuccessHaptic();
      await refetch();
      setPhotoOperation(null);
    } catch (err) {
      setPhotoOperation(null);
      void triggerErrorHaptic();
      setError(normalizeApiError(err).message);
    }
  };

  const updatePhotoOrder = async (photoId: string, direction: 'left' | 'right') => {
    const reorderPlan = buildPhotoReorderPlan(profile?.photos, photoId, direction);
    if (!reorderPlan) return;

    try {
      setPhotoOperation({ type: 'reorder', photoId, label: 'Reordering photos…' });
      await Promise.all([
        updatePhoto({ photoId: reorderPlan.currentPhotoId, payload: { sortOrder: reorderPlan.targetSortOrder } }),
        updatePhoto({ photoId: reorderPlan.targetPhotoId, payload: { sortOrder: reorderPlan.currentSortOrder } }),
      ]);
      void triggerSelectionHaptic();
      await refetch();
      setPhotoOperation(null);
    } catch (err) {
      setPhotoOperation(null);
      void triggerErrorHaptic();
      setError(normalizeApiError(err).message);
    }
  };

  return {
    error,
    editMode,
    showBuildInfo,
    bio,
    city,
    intensityLevel,
    intentDating,
    intentWorkout,
    intentFriends,
    weeklyFrequencyBand,
    primaryGoal,
    selectedActivities,
    selectedSchedule,
    setError,
    setBio,
    setCity,
    setIntensityLevel,
    setIntentDating,
    setIntentWorkout,
    setIntentFriends,
    setWeeklyFrequencyBand,
    setPrimaryGoal,
    setShowBuildInfo,
    selectCitySuggestion: (suggestion: LocationSuggestion) => {
      setCity(suggestion.value);
      setCitySelection({
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
      });
    },
    updateCity: (value: string) => {
      setCity(value);
      setCitySelection(null);
    },
    toggleActivity: (value: string) => setSelectedActivities((current) => toggleValue(current, value)),
    toggleSchedule: (value: string) => setSelectedSchedule((current) => toggleValue(current, value)),
    photoOperation,
    isEditingPhotos: photoOperation !== null,
    cancelEdit: () => {
      resetFromProfile();
      setEditMode(false);
      setError(null);
    },
    save,
    uploadPhoto: pickAndUploadPhoto,
    makePrimaryPhoto: async (photoId: string) => {
      try {
        setPhotoOperation({ type: 'primary', photoId, label: 'Setting primary photo…' });
        await updatePhoto({ photoId, payload: { isPrimary: true } });
        void triggerSelectionHaptic();
        await refetch();
        setPhotoOperation(null);
      } catch (err) {
        setPhotoOperation(null);
        void triggerErrorHaptic();
        setError(normalizeApiError(err).message);
      }
    },
    movePhotoLeft: async (photoId: string) => updatePhotoOrder(photoId, 'left'),
    movePhotoRight: async (photoId: string) => updatePhotoOrder(photoId, 'right'),
    removePhoto: async (photoId: string) => {
      try {
        setPhotoOperation({ type: 'delete', photoId, label: 'Removing photo…' });
        await deletePhoto(photoId);
        void triggerSuccessHaptic();
        await refetch();
        setPhotoOperation(null);
      } catch (err) {
        setPhotoOperation(null);
        void triggerErrorHaptic();
        setError(normalizeApiError(err).message);
      }
    },
  };
}
