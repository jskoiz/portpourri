import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '../../../api/types';
import { normalizeApiError } from '../../../api/errors';
import { normalizeIntensityLevelForForm } from '../../../api/profileIntensity';
import type { LocationSuggestion } from '../../locations/locationSuggestions';
import { triggerErrorHaptic, triggerSuccessHaptic } from '../../../lib/interaction/feedback';
import { showToast } from '../../../store/toastStore';
import { buildSchedulePreferences, parseFavoriteActivities } from '../components/profile.helpers';

const PARTIAL_SAVE_ERROR =
  'Profile basics were saved, but fitness settings could not be saved. Please try again.';
const REFRESH_WARNING =
  'Profile saved, but we could not refresh the latest copy. Pull to refresh if anything looks stale.';

type CityCoordinates = {
  latitude?: number | null;
  longitude?: number | null;
};

type ProfileEditorDraft = {
  bio: string;
  city: string;
  citySelection: CityCoordinates | null;
  intensityLevel: string;
  intentDating: boolean;
  intentWorkout: boolean;
  intentFriends: boolean;
  weeklyFrequencyBand: string;
  primaryGoal: string;
  selectedActivities: string[];
  selectedSchedule: string[];
};

function toggleValue(values: string[], nextValue: string) {
  return values.includes(nextValue)
    ? values.filter((value) => value !== nextValue)
    : [...values, nextValue];
}

function areStringArraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function createDraft(source: User): ProfileEditorDraft {
  return {
    bio: source.profile?.bio || '',
    city: source.profile?.city || '',
    citySelection: {
      latitude: source.profile?.latitude,
      longitude: source.profile?.longitude,
    },
    intensityLevel: normalizeIntensityLevelForForm(source.fitnessProfile?.intensityLevel),
    intentDating: Boolean(source.profile?.intentDating),
    intentWorkout: Boolean(source.profile?.intentWorkout),
    intentFriends: Boolean(source.profile?.intentFriends),
    weeklyFrequencyBand: source.fitnessProfile?.weeklyFrequencyBand || '',
    primaryGoal: source.fitnessProfile?.primaryGoal || '',
    selectedActivities: parseFavoriteActivities(source.fitnessProfile?.favoriteActivities),
    selectedSchedule: buildSchedulePreferences(source.fitnessProfile),
  };
}

export function useProfileEditor({
  profile,
  refetch,
  updateFitness,
  updateProfile,
}: {
  profile: User | null;
  refetch: () => Promise<unknown>;
  updateFitness: (payload: {
    intensityLevel?: string;
    weeklyFrequencyBand?: string;
    primaryGoal?: string;
    favoriteActivities?: string;
    prefersMorning?: boolean;
    prefersEvening?: boolean;
  }) => Promise<unknown>;
  updateProfile: (payload: {
    bio?: string;
    city?: string;
    latitude?: number | null;
    longitude?: number | null;
    intentDating?: boolean;
    intentWorkout?: boolean;
    intentFriends?: boolean;
  }) => Promise<unknown>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<ProfileEditorDraft | null>(null);
  const [baseline, setBaseline] = useState<ProfileEditorDraft | null>(null);
  const saveInFlightRef = useRef(false);

  const syncFromProfile = useCallback((source: User) => {
    const nextDraft = createDraft(source);
    setDraft(nextDraft);
    setBaseline(nextDraft);
  }, []);

  useEffect(() => {
    if (profile && !editMode && !saveInFlightRef.current) {
      syncFromProfile(profile);
    }
  }, [editMode, profile, syncFromProfile]);

  const currentDraft = useMemo<ProfileEditorDraft>(
    () =>
      draft ?? {
        bio: '',
        city: '',
        citySelection: null,
        intensityLevel: '',
        intentDating: false,
        intentWorkout: false,
        intentFriends: false,
        weeklyFrequencyBand: '',
        primaryGoal: '',
        selectedActivities: [],
        selectedSchedule: [],
      },
    [draft],
  );

  const profilePatch = useMemo(() => {
    if (!baseline) {
      return {};
    }

    const trimmedBio = currentDraft.bio.trim();
    const trimmedCity = currentDraft.city.trim();
    const patch: {
      bio?: string;
      city?: string;
      latitude?: number | null;
      longitude?: number | null;
      intentDating?: boolean;
      intentWorkout?: boolean;
      intentFriends?: boolean;
    } = {};

    if (trimmedBio !== baseline.bio.trim()) patch.bio = trimmedBio;
    if (trimmedCity !== baseline.city.trim()) patch.city = trimmedCity;
    if ((currentDraft.citySelection?.latitude ?? null) !== (baseline.citySelection?.latitude ?? null)) {
      patch.latitude = currentDraft.citySelection?.latitude ?? null;
    }
    if ((currentDraft.citySelection?.longitude ?? null) !== (baseline.citySelection?.longitude ?? null)) {
      patch.longitude = currentDraft.citySelection?.longitude ?? null;
    }
    if (currentDraft.intentDating !== baseline.intentDating) patch.intentDating = currentDraft.intentDating;
    if (currentDraft.intentWorkout !== baseline.intentWorkout) patch.intentWorkout = currentDraft.intentWorkout;
    if (currentDraft.intentFriends !== baseline.intentFriends) patch.intentFriends = currentDraft.intentFriends;

    return patch;
  }, [baseline, currentDraft]);

  const fitnessPatch = useMemo(() => {
    if (!baseline) {
      return {};
    }

    const patch: {
      intensityLevel?: string;
      weeklyFrequencyBand?: string;
      primaryGoal?: string;
      favoriteActivities?: string;
      prefersMorning?: boolean;
      prefersEvening?: boolean;
    } = {};

    if (currentDraft.intensityLevel !== baseline.intensityLevel) {
      patch.intensityLevel = currentDraft.intensityLevel;
    }
    if (currentDraft.weeklyFrequencyBand !== baseline.weeklyFrequencyBand) {
      patch.weeklyFrequencyBand = currentDraft.weeklyFrequencyBand;
    }
    if (currentDraft.primaryGoal !== baseline.primaryGoal) {
      patch.primaryGoal = currentDraft.primaryGoal;
    }
    if (!areStringArraysEqual(currentDraft.selectedActivities, baseline.selectedActivities)) {
      patch.favoriteActivities = currentDraft.selectedActivities.join(', ');
    }

    const prefersMorning = currentDraft.selectedSchedule.includes('Morning');
    const baselinePrefersMorning = baseline.selectedSchedule.includes('Morning');
    if (prefersMorning !== baselinePrefersMorning) {
      patch.prefersMorning = prefersMorning;
    }

    const prefersEvening = currentDraft.selectedSchedule.includes('Evening');
    const baselinePrefersEvening = baseline.selectedSchedule.includes('Evening');
    if (prefersEvening !== baselinePrefersEvening) {
      patch.prefersEvening = prefersEvening;
    }

    return patch;
  }, [baseline, currentDraft]);

  const hasProfileChanges = Object.keys(profilePatch).length > 0;
  const hasFitnessChanges = Object.keys(fitnessPatch).length > 0;
  const hasScheduleChanges =
    !!baseline && !areStringArraysEqual(currentDraft.selectedSchedule, baseline.selectedSchedule);
  const hasUnsavedChanges = hasProfileChanges || hasFitnessChanges || hasScheduleChanges;

  const reconcileAfterSave = async () => {
    try {
      await refetch();
    } catch {
      showToast(REFRESH_WARNING, 'warning');
    }
  };

  const save = async () => {
    if (!editMode) {
      setError(null);
      setEditMode(true);
      return;
    }
    if (!baseline || saveInFlightRef.current) {
      return;
    }

    if (!hasUnsavedChanges) {
      setError(null);
      setEditMode(false);
      return;
    }

    saveInFlightRef.current = true;
    setError(null);
    let basicsSaved = false;
    let fitnessSaved = false;
    try {
      if (hasProfileChanges) {
        await updateProfile(profilePatch);
        basicsSaved = true;
        setBaseline((current) =>
          current
            ? {
                ...current,
                bio: currentDraft.bio,
                city: currentDraft.city,
                citySelection: currentDraft.citySelection,
                intentDating: currentDraft.intentDating,
                intentWorkout: currentDraft.intentWorkout,
                intentFriends: currentDraft.intentFriends,
              }
            : current,
        );
      }

      if (hasFitnessChanges) {
        await updateFitness(fitnessPatch);
        fitnessSaved = true;
        setBaseline((current) =>
          current
            ? {
                ...current,
                intensityLevel: currentDraft.intensityLevel,
                weeklyFrequencyBand: currentDraft.weeklyFrequencyBand,
                primaryGoal: currentDraft.primaryGoal,
                selectedActivities: currentDraft.selectedActivities,
                selectedSchedule: currentDraft.selectedSchedule,
              }
            : current,
        );
      }

      void triggerSuccessHaptic();
      showToast(hasProfileChanges && hasFitnessChanges ? 'Profile saved' : 'Changes saved', 'success');
      setEditMode(false);
      saveInFlightRef.current = false;
      await reconcileAfterSave();
    } catch (err) {
      void triggerErrorHaptic();
      if (basicsSaved && !fitnessSaved) {
        saveInFlightRef.current = false;
        await reconcileAfterSave();
        setError(PARTIAL_SAVE_ERROR);
        return;
      }

      setError(normalizeApiError(err).message);
      saveInFlightRef.current = false;
    }
  };

  return {
    error,
    editMode,
    hasUnsavedChanges,
    bio: currentDraft.bio,
    city: currentDraft.city,
    intensityLevel: currentDraft.intensityLevel,
    intentDating: currentDraft.intentDating,
    intentWorkout: currentDraft.intentWorkout,
    intentFriends: currentDraft.intentFriends,
    weeklyFrequencyBand: currentDraft.weeklyFrequencyBand,
    primaryGoal: currentDraft.primaryGoal,
    selectedActivities: currentDraft.selectedActivities,
    selectedSchedule: currentDraft.selectedSchedule,
    setError,
    setBio: (bio: string) => setDraft((current) => (current ? { ...current, bio } : current)),
    setIntensityLevel: (intensityLevel: string) =>
      setDraft((current) => (current ? { ...current, intensityLevel } : current)),
    setIntentDating: (intentDating: boolean) =>
      setDraft((current) => (current ? { ...current, intentDating } : current)),
    setIntentWorkout: (intentWorkout: boolean) =>
      setDraft((current) => (current ? { ...current, intentWorkout } : current)),
    setIntentFriends: (intentFriends: boolean) =>
      setDraft((current) => (current ? { ...current, intentFriends } : current)),
    setWeeklyFrequencyBand: (weeklyFrequencyBand: string) =>
      setDraft((current) => (current ? { ...current, weeklyFrequencyBand } : current)),
    setPrimaryGoal: (primaryGoal: string) =>
      setDraft((current) => (current ? { ...current, primaryGoal } : current)),
    selectCitySuggestion: (suggestion: LocationSuggestion) => {
      setDraft((current) =>
        current
          ? {
              ...current,
              city: suggestion.value,
              citySelection: {
                latitude: suggestion.latitude,
                longitude: suggestion.longitude,
              },
            }
          : current,
      );
    },
    updateCity: (value: string) => {
      setDraft((current) =>
        current
          ? {
              ...current,
              city: value,
              citySelection: null,
            }
          : current,
      );
    },
    toggleActivity: (value: string) =>
      setDraft((current) =>
        current
          ? {
              ...current,
              selectedActivities: toggleValue(current.selectedActivities, value),
            }
          : current,
      ),
    toggleSchedule: (value: string) =>
      setDraft((current) =>
        current
          ? {
              ...current,
              selectedSchedule: toggleValue(current.selectedSchedule, value),
            }
          : current,
      ),
    cancelEdit: () => {
      if (baseline) {
        setDraft(baseline);
      } else if (profile) {
        syncFromProfile(profile);
      }
      setEditMode(false);
      setError(null);
    },
    save,
  };
}
