import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import client from '../api/client';
import { normalizeApiError } from '../api/errors';
import type { User } from '../api/types';
import AppButton from '../components/ui/AppButton';
import AppCard from '../components/ui/AppCard';
import AppInput from '../components/ui/AppInput';
import AppState from '../components/ui/AppState';
import { colors, spacing, typography } from '../theme/tokens';

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [verifyCode, setVerifyCode] = useState('');

  const [intensityLevel, setIntensityLevel] = useState('');
  const [weeklyFrequencyBand, setWeeklyFrequencyBand] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [favoriteActivities, setFavoriteActivities] = useState('');

  useEffect(() => { if (user) fetchProfile(); else setLoading(false); }, [user]);

  const fetchProfile = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await client.get<User>('/profile');
      const nextProfile = response.data;
      setProfile(nextProfile);
      setIntensityLevel(nextProfile.fitnessProfile?.intensityLevel || '');
      setWeeklyFrequencyBand(nextProfile.fitnessProfile?.weeklyFrequencyBand || '');
      setPrimaryGoal(nextProfile.fitnessProfile?.primaryGoal || '');
      setFavoriteActivities(nextProfile.fitnessProfile?.favoriteActivities || '');
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  const startVerification = async (channel: 'email' | 'phone', target?: string) => {
    if (!target) return;
    try {
      const response = await client.post('/verification/start', { channel, target });
      setError(`Verification started. Dev code: ${response.data?.devCode ?? 'sent'}`);
    } catch (err) {
      setError(normalizeApiError(err).message);
    }
  };

  const confirmVerification = async (channel: 'email' | 'phone') => {
    try {
      await client.post('/verification/confirm', { channel, code: verifyCode });
      setVerifyCode('');
      await fetchProfile(true);
    } catch (err) {
      setError(normalizeApiError(err).message);
    }
  };

  const saveFitness = async () => {
    const nextErrors: Record<string, string> = {};
    if (!intensityLevel.trim()) nextErrors.intensityLevel = 'Intensity is required.';
    if (!weeklyFrequencyBand.trim()) nextErrors.weeklyFrequencyBand = 'Weekly frequency is required.';
    if (!primaryGoal.trim()) nextErrors.primaryGoal = 'Primary goal is required.';
    if (!favoriteActivities.trim()) nextErrors.favoriteActivities = 'Add at least one activity.';
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setError(null);
    try {
      await client.put('/profile/fitness', { intensityLevel, weeklyFrequencyBand, primaryGoal, favoriteActivities });
      await fetchProfile(true);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AppState title="Loading your profile" loading />;
  if (error && !profile) return <AppState title="Couldn’t load profile" description={error} actionLabel="Retry" onAction={fetchProfile} />;
  if (!profile) return <AppState title="No profile found" actionLabel="Refresh" onAction={fetchProfile} />;

  const primaryPhoto = profile.photos?.find((p) => p.isPrimary)?.storageKey || profile.photoUrl;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProfile(true)} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Personal space</Text>
            <Text style={styles.headerTitle}>You</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <AppButton label="Alerts" variant="ghost" onPress={() => navigation.navigate('Notifications')} />
            <AppButton label="Log out" variant="ghost" onPress={logout} />
          </View>
        </View>

        <View style={styles.profileHeader}>
          <Image source={{ uri: primaryPhoto || 'https://via.placeholder.com/150' }} style={styles.avatar} />
          <Text style={styles.name}>{profile.firstName}, {profile.age ?? '--'}</Text>
          <Text style={styles.location}>{profile.profile?.city || 'Location not set'}</Text>
        </View>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{profile.profile?.bio || 'No bio yet.'}</Text>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Edit fitness profile</Text>
          <AppInput label="Intensity" value={intensityLevel} onChangeText={(v) => { setIntensityLevel(v); if (fieldErrors.intensityLevel) setFieldErrors((p) => ({ ...p, intensityLevel: '' })); }} placeholder="moderate" error={fieldErrors.intensityLevel} />
          <AppInput label="Weekly frequency" value={weeklyFrequencyBand} onChangeText={(v) => { setWeeklyFrequencyBand(v); if (fieldErrors.weeklyFrequencyBand) setFieldErrors((p) => ({ ...p, weeklyFrequencyBand: '' })); }} placeholder="3-4" error={fieldErrors.weeklyFrequencyBand} />
          <AppInput label="Primary goal" value={primaryGoal} onChangeText={(v) => { setPrimaryGoal(v); if (fieldErrors.primaryGoal) setFieldErrors((p) => ({ ...p, primaryGoal: '' })); }} placeholder="health" error={fieldErrors.primaryGoal} />
          <AppInput label="Favorite activities" value={favoriteActivities} onChangeText={(v) => { setFavoriteActivities(v); if (fieldErrors.favoriteActivities) setFieldErrors((p) => ({ ...p, favoriteActivities: '' })); }} placeholder="running, yoga" error={fieldErrors.favoriteActivities} />
          <AppButton label="Save changes" onPress={saveFitness} loading={saving} />
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Verification</Text>
          <Text style={styles.bio}>Email: {profile.hasVerifiedEmail ? 'Verified' : 'Not verified'}</Text>
          <Text style={styles.bio}>Phone: {profile.hasVerifiedPhone ? 'Verified' : 'Not verified'}</Text>
          <AppButton label="Verify email" variant="secondary" onPress={() => startVerification('email', profile.email || undefined)} />
          <AppButton label="Verify phone" variant="secondary" onPress={() => startVerification('phone', profile.phoneNumber || undefined)} />
          <AppInput label="Verification code" value={verifyCode} onChangeText={setVerifyCode} placeholder="Enter 6-digit code" />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <AppButton label="Confirm email" variant="ghost" onPress={() => confirmVerification('email')} />
            <AppButton label="Confirm phone" variant="ghost" onPress={() => confirmVerification('phone')} />
          </View>
        </AppCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  kicker: { color: colors.accentSoft, fontSize: typography.caption, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700' },
  headerTitle: { fontSize: typography.h2, fontWeight: '800', color: colors.textPrimary },
  profileHeader: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: { width: 122, height: 122, borderRadius: 61, marginBottom: spacing.md, borderWidth: 2, borderColor: colors.border },
  name: { fontSize: typography.h1, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
  location: { fontSize: typography.body, color: colors.textSecondary },
  sectionCard: { marginBottom: spacing.md },
  sectionTitle: { fontSize: typography.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  bio: { fontSize: typography.body, color: colors.textSecondary, lineHeight: 22 },
  errorText: { color: colors.danger, textAlign: 'center', marginTop: spacing.sm },
});
