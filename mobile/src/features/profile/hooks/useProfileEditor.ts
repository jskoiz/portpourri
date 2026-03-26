import { useCallback, useEffect, useState } from 'react';
import type { User } from '../../../api/types';
import { normalizeApiError } from '../../../api/errors';
import { normalizeIntensityLevelForForm } from '../../../api/profileIntensity';
import type { LocationSuggestion } from '../../locations/locationSuggestions';
import { triggerErrorHaptic, triggerSuccessHaptic } from '../../../lib/interaction/feedback';
import { showToast } from '../../../store/toastStore';
import { buildSchedulePreferences, parseFavoriteActivities } from '../components/profile.helpers';

const PARTIAL_SAVE_ERROR =
  'Profile basics were saved, but fitness settings could not be saved. Please try again.';

function toggleValue(values: string[], nextValue: string) {
  return values.includes(nextValue)
    ? values.filter((value) => value !== nextValue)
    : [...values, nextValue];
}

export function useProfileEditor({
  profile,
  updateFitness,
  updateProfile,
}: {
  profile: User | null;
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

  const syncFromProfile = useCallback((source: User) => {
    setBio(source.profile?.bio || '');
    setCity(source.profile?.city || '');
    setCitySelection({
      latitude: source.profile?.latitude ?? undefined,
      longitude: source.profile?.longitude ?? undefined,
    });
    setIntensityLevel(normalizeIntensityLevelForForm(source.fitnessProfile?.intensityLevel));
    setIntentDating(Boolean(source.profile?.intentDating));
    setIntentWorkout(Boolean(source.profile?.intentWorkout));
    setIntentFriends(Boolean(source.profile?.intentFriends));
    setWeeklyFrequencyBand(source.fitnessProfile?.weeklyFrequencyBand || '');
    setPrimaryGoal(source.fitnessProfile?.primaryGoal || '');
    setSelectedActivities(parseFavoriteActivities(source.fitnessProfile?.favoriteActivities));
    setSelectedSchedule(buildSchedulePreferences(source.fitnessProfile));
  }, []);

  useEffect(() => {
    if (profile) syncFromProfile(profile);
  }, [profile, syncFromProfile]);

  const selectCitySuggestion = useCallback((suggestion: LocationSuggestion) => {
    setCity(suggestion.value);
    setCitySelection({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
  }, []);
  const updateCity = useCallback((value: string) => {
    setCity(value);
    setCitySelection(null);
  }, []);
  const toggleActivity = useCallback((value: string) => setSelectedActivities((current) => toggleValue(current, value)), []);
  const toggleSchedule = useCallback((value: string) => setSelectedSchedule((current) => toggleValue(current, value)), []);
  const cancelEdit = useCallback(() => {
    if (profile) syncFromProfile(profile);
    setEditMode(false);
    setError(null);
  }, [profile, syncFromProfile]);
  const save = useCallback(async () => {
    if (!editMode) {
      setEditMode(true);
      return;
    }

    setError(null);
    let basicsSaved = false;
    let fitnessSaved = false;
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
      basicsSaved = true;
      await updateFitness({
        intensityLevel,
        weeklyFrequencyBand,
        primaryGoal,
        favoriteActivities: selectedActivities.join(', '),
        prefersMorning: selectedSchedule.includes('Morning'),
        prefersEvening: selectedSchedule.includes('Evening'),
      });
      fitnessSaved = true;
      void triggerSuccessHaptic();
      showToast('Profile saved', 'success');
      setEditMode(false);
    } catch (err) {
      void triggerErrorHaptic();
      if (basicsSaved && !fitnessSaved) {
        setError(PARTIAL_SAVE_ERROR);
        return;
      }

      setError(normalizeApiError(err).message);
    }
  }, [
    bio,
    city,
    citySelection,
    editMode,
    intentDating,
    intentFriends,
    intentWorkout,
    primaryGoal,
    selectedActivities,
    selectedSchedule,
    intensityLevel,
    updateFitness,
    updateProfile,
    weeklyFrequencyBand,
  ]);

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
    selectCitySuggestion,
    updateCity,
    toggleActivity,
    toggleSchedule,
    cancelEdit,
    save,
  };
}
