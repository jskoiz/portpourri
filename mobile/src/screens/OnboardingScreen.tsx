import React, { useMemo, useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView, View, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import client from '../api/client';
import { useAuthStore } from '../store/authStore';
import { normalizeApiError } from '../api/errors';
import AppButton from '../components/ui/AppButton';
import AppInput from '../components/ui/AppInput';
import AppBackButton from '../components/ui/AppBackButton';
import { colors, radii, spacing, typography } from '../theme/tokens';

const INTENSITY_LEVELS = ['light', 'moderate', 'intense', 'athlete'];
const FREQUENCY_BANDS = ['1-2', '3-4', '5-6', '7+'];
const GOALS = ['performance', 'aesthetics', 'health', 'weight-loss'];

export default function OnboardingScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [intensity, setIntensity] = useState('moderate');
  const [frequency, setFrequency] = useState('3-4');
  const [goal, setGoal] = useState('health');
  const [activities, setActivities] = useState('Running, yoga');
  const [saving, setSaving] = useState(false);
  const [activitiesError, setActivitiesError] = useState('');

  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const canSubmit = useMemo(() => activities.trim().length > 0, [activities]);

  const handleSubmit = async () => {
    if (!activities.trim()) {
      setActivitiesError('Add at least one activity to personalize your feed.');
      return;
    }

    setSaving(true);
    setActivitiesError('');
    try {
      await client.put('/profile/fitness', {
        intensityLevel: intensity,
        weeklyFrequencyBand: frequency,
        primaryGoal: goal,
        favoriteActivities: activities,
      });

      if (user) setUser({ ...user, isOnboarded: true });
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error) {
      Alert.alert('Could not save profile', normalizeApiError(error).message);
    } finally {
      setSaving(false);
    }
  };

  const renderOptions = (items: string[], current: string, onSelect: (v: string) => void) => (
    <View style={styles.optionsRow}>
      {items.map((item) => (
        <TouchableOpacity
          key={item}
          style={[styles.option, current === item && styles.optionSelected]}
          onPress={() => onSelect(item)}
          disabled={saving}
        >
          <Text style={[styles.optionText, current === item && styles.optionTextSelected]}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]} keyboardShouldPersistTaps="handled">
        {navigation.canGoBack() ? <AppBackButton onPress={() => navigation.goBack()} disabled={saving} /> : null}

        <Text style={styles.title}>Set your pace</Text>
        <Text style={styles.subtitle}>These preferences help BRDG show better matches from day one.</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Training intensity</Text>
          {renderOptions(INTENSITY_LEVELS, intensity, setIntensity)}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Workouts per week</Text>
          {renderOptions(FREQUENCY_BANDS, frequency, setFrequency)}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Primary goal</Text>
          {renderOptions(GOALS, goal, setGoal)}
        </View>

        <AppInput
          label="Favorite activities"
          placeholder="Pilates, hiking, lifting"
          value={activities}
          onChangeText={(v) => {
            setActivities(v);
            if (activitiesError) setActivitiesError('');
          }}
          editable={!saving}
          error={activitiesError}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}> 
        <AppButton label="Finish setup" onPress={handleSubmit} loading={saving} disabled={!canSubmit || saving} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.xl },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  title: { fontSize: typography.h1, color: colors.textPrimary, fontWeight: '700', marginBottom: spacing.sm },
  subtitle: { fontSize: typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  section: { marginBottom: spacing.lg },
  label: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '600', marginBottom: spacing.sm },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { color: colors.textSecondary, fontSize: typography.bodySmall, textTransform: 'capitalize', fontWeight: '600' },
  optionTextSelected: { color: colors.black },
});
