import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { normalizeApiError } from '../api/errors';
import { discoveryApi, matchesApi } from '../services/api';
import AppBackButton from '../components/ui/AppBackButton';
import AppButton from '../components/ui/AppButton';
import AppIcon from '../components/ui/AppIcon';
import AppBackdrop from '../components/ui/AppBackdrop';
import { useTheme } from '../theme/useTheme';
import { radii, spacing, typography } from '../theme/tokens';
import { type SessionIntent } from '../types/sessionIntent';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_HEIGHT = 420;

const BASE = '#0D1117';
const SURFACE = '#161B22';
const PRIMARY = '#7C6AF7';
const ACCENT = '#34D399';
const BORDER = 'rgba(255,255,255,0.08)';
const TEXT_PRIMARY = '#F0F6FC';
const TEXT_MUTED = 'rgba(240,246,252,0.45)';

export default function ProfileDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user } = route.params as any;
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const primaryPhoto = user.photos?.find((p: any) => p.isPrimary)?.storageKey || user.photoUrl;
  const activityTags: string[] = (user.fitnessProfile?.favoriteActivities || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  const intent: SessionIntent | null =
    user.profile?.intentDating && user.profile?.intentWorkout ? 'both' :
    user.profile?.intentDating ? 'dating' :
    user.profile?.intentWorkout ? 'workout' :
    null;

  const intentDisplay =
    intent === 'dating' ? 'Dating' :
    intent === 'workout' ? 'Training partner' :
    intent === 'both' ? 'Open to both' :
    null;
  const structuredRows = [
    {
      label: 'Pace',
      value: user.fitnessProfile?.intensityLevel ? `${user.fitnessProfile.intensityLevel}` : 'Conversational',
    },
    {
      label: 'Prefers',
      value: activityTags.slice(0, 2).join(' / ') || 'Night runs',
    },
    {
      label: 'Intent',
      value: intentDisplay || 'Meet after',
    },
  ];

  const handleSuggestActivity = async () => {
    const firstActivity = activityTags[0] || 'a workout';
    const suggestion = `Let's plan ${firstActivity} together.`;
    setSubmitting(true);
    try {
      const response = await matchesApi.list();
      const existingMatch = (response.data ?? []).find((match) => match.user.id === user.id);

      if (!existingMatch) {
        Alert.alert(
          'Match required',
          'Once you both match, you can jump straight into chat with a suggested plan.',
        );
        return;
      }

      navigation.navigate('Chat', {
        matchId: existingMatch.id,
        user: existingMatch.user,
        prefillMessage: suggestion,
      });
    } catch (error) {
      Alert.alert('Could not open chat', normalizeApiError(error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePass = async () => {
    setSubmitting(true);
    try {
      await discoveryApi.pass(user.id);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not pass profile', normalizeApiError(error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    setSubmitting(true);
    try {
      await discoveryApi.like(user.id);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not like profile', normalizeApiError(error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppBackdrop />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <Image
            source={
              primaryPhoto
                ? { uri: primaryPhoto }
                : require('../../assets/icon.png')
            }
            style={styles.heroImage}
            contentFit="cover"
          />

          <LinearGradient
            colors={['transparent', 'rgba(13,17,23,0.7)', 'rgba(13,17,23,0.98)']}
            locations={[0, 0.55, 1]}
            style={styles.heroGradient}
          />

          <View style={styles.backButtonOverlay}>
            <AppBackButton onPress={() => navigation.goBack()} style={{ marginBottom: 0 }} />
          </View>

          <View style={styles.heroNameOverlay}>
            {intentDisplay && (
              <View style={styles.intentPill}>
                <Text style={styles.intentPillText}>{intentDisplay}</Text>
              </View>
            )}
            <Text style={styles.heroName}>
              {user.firstName || 'Someone'}{user.age ? `, ${user.age}` : ''}
            </Text>
            <View style={styles.locationRow}>
              <AppIcon name="map-pin" size={14} color={TEXT_MUTED} />
              <Text style={styles.heroLocation}>
                {user.profile?.city || 'Nearby'}
              </Text>
            </View>

            {activityTags.length > 0 && (
              <View style={styles.tagRow}>
                {activityTags.slice(0, 4).map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.contentArea}>
          {!!user.profile?.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>About</Text>
              <Text style={styles.bio}>{user.profile.bio}</Text>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.metaPanel}>
              {user.fitnessProfile?.weeklyFrequencyBand ? (
                <View style={styles.metaIntroCard}>
                  <Text style={styles.metaIntroText}>
                    Moves {user.fitnessProfile.weeklyFrequencyBand}x per week and prefers cleaner, aligned plans over filler.
                  </Text>
                </View>
              ) : null}

              {structuredRows.map((row) => (
                <StructuredRow key={row.label} label={row.label} value={row.value} />
              ))}
            </View>
          </View>

          {activityTags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Movement Identity</Text>
              <View style={styles.activityPills}>
                {activityTags.slice(0, 3).map((tag, i) => {
                  const isAccent = i % 2 === 0;
                  return (
                    <View
                      key={tag}
                      style={[
                        styles.activityPill,
                        {
                          backgroundColor: isAccent ? 'rgba(52,211,153,0.10)' : 'rgba(124,106,247,0.10)',
                          borderColor: isAccent ? 'rgba(52,211,153,0.24)' : 'rgba(124,106,247,0.24)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.activityPillText,
                          { color: isAccent ? ACCENT : PRIMARY },
                        ]}
                      >
                        {tag}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <Pressable
            onPress={handleSuggestActivity}
            style={styles.suggestBtn}
          >
            <LinearGradient
              colors={['#9B8BFF', PRIMARY]}
              style={styles.suggestBtnInner}
            >
              <Text style={styles.suggestBtnText}>Suggest activity</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>

      <LinearGradient
        colors={['rgba(13,17,23,0)', 'rgba(13,17,23,0.95)', '#0D1117']}
        style={styles.actionBar}
      >
        <View style={styles.actionRow}>
          <AppButton
            label="Pass"
            variant="secondary"
            onPress={handlePass}
            disabled={submitting}
            style={styles.actionBtn}
          />
          <AppButton
            label="Like"
            variant="primary"
            onPress={handleLike}
            disabled={submitting}
            loading={submitting}
            style={styles.actionBtnPrimary}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

function StructuredRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.structuredRow}>
      <Text style={styles.structuredLabel}>{label}</Text>
      <Text style={styles.structuredValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BASE,
  },
  scrollContent: {
    paddingBottom: 130,
  },

  // Hero
  heroContainer: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT * 0.75,
  },
  backButtonOverlay: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    backgroundColor: 'rgba(13,17,23,0.56)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  heroNameOverlay: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.xxl,
    right: spacing.xxl,
  },
  intentPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124,106,247,0.18)',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(124,106,247,0.34)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  intentPillText: {
    color: PRIMARY,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroName: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  heroLocation: {
    fontSize: typography.bodySmall,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Content
  contentArea: {
    backgroundColor: 'rgba(13,17,23,0.92)',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontWeight: '800',
    color: PRIMARY,
    marginBottom: spacing.md,
  },
  bio: {
    fontSize: typography.body,
    lineHeight: 28,
    color: TEXT_PRIMARY,
    opacity: 0.88,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaPanel: {
    gap: spacing.sm,
  },
  metaIntroCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(28,35,48,0.82)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  metaIntroText: {
    color: TEXT_PRIMARY,
    opacity: 0.86,
    lineHeight: 22,
    fontSize: typography.bodySmall,
  },
  activityPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  activityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  activityPillText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  structuredRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(20,26,38,0.76)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  structuredLabel: {
    color: TEXT_MUTED,
    fontSize: typography.bodySmall,
    fontWeight: '600',
  },
  structuredValue: {
    color: TEXT_PRIMARY,
    fontSize: typography.bodySmall,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  // Suggest btn
  suggestBtn: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: 120,
    marginTop: spacing.sm,
  },
  suggestBtnInner: {
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  suggestBtnText: {
    fontSize: typography.body,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Action bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 24,
    paddingBottom: spacing.xxl,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  actionBtn: {
    flex: 1,
  },
  actionBtnPrimary: {
    flex: 2,
  },
});
