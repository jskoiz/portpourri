import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '../../../api/types';
import { normalizeApiError } from '../../../api/errors';
import { normalizeIntensityLevelForForm } from '../../../api/profileIntensity';
import type { LocationSuggestion } from '../../locations/locationSuggestions';
import { triggerErrorHaptic, triggerSuccessHaptic } from '../../../lib/interaction/feedback';
import { showToast } from '../../../store/toastStore';
import {
  buildSchedulePreferences,
  getDiscoveryPreferenceValue,
  parseFavoriteActivities,
} from '../components/profile.helpers';

const PROFILE_COMPLETENESS_BIO_MIN_CHARS = 20;
const BIO_COMPLETENESS_ERROR =
  `Bio must be at least ${PROFILE_COMPLETENESS_BIO_MIN_CHARS} characters to count toward profile completion.`;

function toggleValue(values: string[], nextValue: string) {
  return values.includes(nextValue)
    ? values.filter((value) => value !== nextValue)
    : [...values, nextValue];
}

function getDiscoveryPreferenceFlags(preference: 'men' | 'women' | 'both') {
  return {
    showMeMen: preference === 'men' || preference === 'both',
    showMeWomen: preference === 'women' || preference === 'both',
  };
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
    showMeMen?: boolean;
    showMeWomen?: boolean;
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
  const [discoveryPreference, setDiscoveryPreference] = useState<'men' | 'women' | 'both'>('both');
  const [weeklyFrequencyBand, setWeeklyFrequencyBand] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string[]>([]);

  // Ref holds frequently-changing form values so the save callback can read
  // current state without closing over every field (stabilises callback identity).
  const formRef = useRef({
    editMode,
    bio,
    city,
    citySelection,
    intensityLevel,
    intentDating,
    intentWorkout,
    intentFriends,
    discoveryPreference,
    weeklyFrequencyBand,
    primaryGoal,
    selectedActivities,
    selectedSchedule,
  });
  useEffect(() => {
    formRef.current = {
      editMode,
      bio,
      city,
      citySelection,
      intensityLevel,
      intentDating,
      intentWorkout,
      intentFriends,
      discoveryPreference,
      weeklyFrequencyBand,
      primaryGoal,
      selectedActivities,
      selectedSchedule,
    };
  });
  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

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
    setDiscoveryPreference(
      getDiscoveryPreferenceValue(source.showMeMen, source.showMeWomen),
    );
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
  // Per-section save: bio + city. Returns true on success, false on failure.
  const saveBio = useCallback(async (): Promise<boolean> => {
    const f = formRef.current;
    setError(null);
    const nextBio = f.bio.trim();
    const currentBio = profileRef.current?.profile?.bio?.trim() ?? '';
    const isAddingFirstBio = currentBio.length === 0 && nextBio.length > 0;
    if (isAddingFirstBio && nextBio.length < PROFILE_COMPLETENESS_BIO_MIN_CHARS) {
      void triggerErrorHaptic();
      setError(BIO_COMPLETENESS_ERROR);
      return false;
    }
    try {
      await updateProfile({
        bio: nextBio,
        city: f.city.trim(),
        latitude: f.citySelection?.latitude,
        longitude: f.citySelection?.longitude,
      });
      void triggerSuccessHaptic();
      showToast('About updated', 'success');
      return true;
    } catch (err) {
      void triggerErrorHaptic();
      setError(normalizeApiError(err).message);
      return false;
    }
  }, [updateProfile]);

  // Per-section save: intent. Returns true on success, false on failure.
  const saveIntent = useCallback(async (): Promise<boolean> => {
    const f = formRef.current;
    setError(null);
    try {
      await updateProfile({
        intentDating: f.intentDating,
        intentWorkout: f.intentWorkout,
        intentFriends: f.intentFriends,
      });
      void triggerSuccessHaptic();
      showToast('Intent updated', 'success');
      return true;
    } catch (err) {
      void triggerErrorHaptic();
      setError(normalizeApiError(err).message);
      return false;
    }
  }, [updateProfile]);

  // Per-section save: fitness profile. Returns true on success, false on failure.
  const saveFitness = useCallback(async (): Promise<boolean> => {
    const f = formRef.current;
    setError(null);
    try {
      await updateFitness({
        intensityLevel: f.intensityLevel,
        weeklyFrequencyBand: f.weeklyFrequencyBand,
        primaryGoal: f.primaryGoal,
        favoriteActivities: f.selectedActivities.join(', '),
        prefersMorning: f.selectedSchedule.includes('Morning'),
        prefersEvening: f.selectedSchedule.includes('Evening'),
      });
      void triggerSuccessHaptic();
      showToast('Fitness profile updated', 'success');
      return true;
    } catch (err) {
      void triggerErrorHaptic();
      setError(normalizeApiError(err).message);
      return false;
    }
  }, [updateFitness]);

  // Legacy full save (keeps backward compatibility with old ProfileScreenContent)
  const save = useCallback(async () => {
    const f = formRef.current;
    if (!f.editMode) {
      setEditMode(true);
      return;
    }

    setError(null);
    const nextBio = f.bio.trim();
    const currentBio = profileRef.current?.profile?.bio?.trim() ?? '';
    const isAddingFirstBio = currentBio.length === 0 && nextBio.length > 0;
    if (
      isAddingFirstBio &&
      nextBio.length < PROFILE_COMPLETENESS_BIO_MIN_CHARS
    ) {
      void triggerErrorHaptic();
      setError(BIO_COMPLETENESS_ERROR);
      return;
    }
    try {
      const nextDiscoveryFlags = getDiscoveryPreferenceFlags(f.discoveryPreference);
      const currentDiscoveryFlags = getDiscoveryPreferenceFlags(
        getDiscoveryPreferenceValue(profileRef.current?.showMeMen, profileRef.current?.showMeWomen),
      );

      const [profileResult, fitnessResult] = await Promise.allSettled([
        updateProfile({
          bio: nextBio,
          city: f.city.trim(),
          latitude: f.citySelection?.latitude,
          longitude: f.citySelection?.longitude,
          intentDating: f.intentDating,
          intentWorkout: f.intentWorkout,
          intentFriends: f.intentFriends,
          ...(nextDiscoveryFlags.showMeMen !== currentDiscoveryFlags.showMeMen
            ? { showMeMen: nextDiscoveryFlags.showMeMen }
            : {}),
          ...(nextDiscoveryFlags.showMeWomen !== currentDiscoveryFlags.showMeWomen
            ? { showMeWomen: nextDiscoveryFlags.showMeWomen }
            : {}),
        }),
        updateFitness({
          intensityLevel: f.intensityLevel,
          weeklyFrequencyBand: f.weeklyFrequencyBand,
          primaryGoal: f.primaryGoal,
          favoriteActivities: f.selectedActivities.join(', '),
          prefersMorning: f.selectedSchedule.includes('Morning'),
          prefersEvening: f.selectedSchedule.includes('Evening'),
        }),
      ]);

      const profileFailed = profileResult.status === 'rejected';
      const fitnessFailed = fitnessResult.status === 'rejected';

      if (profileFailed || fitnessFailed) {
        void triggerErrorHaptic();
        const messages = [
          profileFailed ? normalizeApiError(profileResult.reason).message : null,
          fitnessFailed ? normalizeApiError(fitnessResult.reason).message : null,
        ].filter(Boolean).join(' · ');
        setError(messages);
        return;
      }

      void triggerSuccessHaptic();
      showToast('Profile saved', 'success');
      setEditMode(false);
    } catch (err) {
      void triggerErrorHaptic();
      setError(normalizeApiError(err).message);
    }
  }, [updateProfile, updateFitness]);

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
    discoveryPreference,
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
    setDiscoveryPreference,
    setWeeklyFrequencyBand,
    setPrimaryGoal,
    setShowBuildInfo,
    selectCitySuggestion,
    updateCity,
    toggleActivity,
    toggleSchedule,
    cancelEdit,
    save,
    saveBio,
    saveFitness,
    saveIntent,
  };
}
