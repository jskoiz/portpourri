import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppState from '../components/ui/AppState';
import { normalizeApiError } from '../api/errors';
import { useAuthStore } from '../store/authStore';
import { useProfile } from '../features/profile/hooks/useProfile';
import { buildSchedulePreferences, parseFavoriteActivities } from '../features/profile/components/profile.helpers';
import { ProfileScreenContent } from '../features/profile/components/ProfileScreenContent';
import type { MainTabScreenProps } from '../core/navigation/types';

function toggleValue(values: string[], nextValue: string) {
  return values.includes(nextValue) ? values.filter((value) => value !== nextValue) : [...values, nextValue];
}

export default function ProfileScreen() {
  const logout = useAuthStore((state) => state.logout);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const navigation = useNavigation<MainTabScreenProps<'You'>['navigation']>();
  const { error: queryError, isLoading, isRefetching, profile, refetch, updateFitness, isSavingFitness } = useProfile();
  const [error, setError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showBuildInfo, setShowBuildInfo] = useState(false);
  const [intensityLevel, setIntensityLevel] = useState('');
  const [weeklyFrequencyBand, setWeeklyFrequencyBand] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string[]>([]);

  useEffect(() => {
    if (!profile) return;
    setIntensityLevel(profile.fitnessProfile?.intensityLevel || '');
    setWeeklyFrequencyBand(profile.fitnessProfile?.weeklyFrequencyBand || '');
    setPrimaryGoal(profile.fitnessProfile?.primaryGoal || '');
    setSelectedActivities(parseFavoriteActivities(profile.fitnessProfile?.favoriteActivities));
    setSelectedSchedule(buildSchedulePreferences(profile.fitnessProfile));
  }, [profile]);

  const errorMessage = error ?? (queryError ? normalizeApiError(queryError).message : null);

  if (isLoading) return <AppState title="Loading your profile" loading />;
  if (errorMessage && !profile) {
    return <AppState title="Couldn't load profile" description={errorMessage} actionLabel="Retry" onAction={() => { void refetch(); }} isError />;
  }
  if (!profile) {
    return <AppState title="No profile found" actionLabel="Refresh" onAction={() => { void refetch(); }} />;
  }

  return (
    <ProfileScreenContent
      deletingAccount={deletingAccount}
      editMode={editMode}
      errorMessage={errorMessage}
      intensityLevel={intensityLevel}
      isRefetching={isRefetching && !isLoading}
      isSavingFitness={isSavingFitness}
      navigation={navigation as any}
      onCancelEdit={() => setEditMode(false)}
      onConfirmDeleteAccount={() => {
        if (deletingAccount) return;
        Alert.alert(
          'Delete account?',
          'This permanently removes your profile, matches, messages, event RSVPs, and saved session.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete account',
              style: 'destructive',
              onPress: async () => {
                setDeletingAccount(true);
                setError(null);
                try {
                  await deleteAccount();
                } catch (err) {
                  setError(normalizeApiError(err).message);
                } finally {
                  setDeletingAccount(false);
                }
              },
            },
          ],
        );
      }}
      onRefresh={() => { void refetch(); }}
      onLogout={() => {
        void logout();
      }}
      onSave={() => {
        if (!editMode) {
          setEditMode(true);
          return;
        }
        void (async () => {
          setError(null);
          try {
            await updateFitness({
              intensityLevel,
              weeklyFrequencyBand,
              primaryGoal,
              favoriteActivities: selectedActivities.join(', '),
              prefersMorning: selectedSchedule.includes('Morning'),
              prefersEvening: selectedSchedule.includes('Evening'),
            });
            setEditMode(false);
            await refetch();
          } catch (err) {
            setError(normalizeApiError(err).message);
          }
        })();
      }}
      onSetIntensityLevel={setIntensityLevel}
      onSetPrimaryGoal={setPrimaryGoal}
      onSetSelectedActivities={(value) => setSelectedActivities((current) => toggleValue(current, value))}
      onSetSelectedSchedule={(value) => setSelectedSchedule((current) => toggleValue(current, value))}
      onSetWeeklyFrequencyBand={setWeeklyFrequencyBand}
      onToggleBuildInfo={() => setShowBuildInfo((current) => !current)}
      primaryGoal={primaryGoal}
      profile={profile}
      selectedActivities={selectedActivities}
      selectedSchedule={selectedSchedule}
      showBuildInfo={showBuildInfo}
      weeklyFrequencyBand={weeklyFrequencyBand}
    />
  );
}
