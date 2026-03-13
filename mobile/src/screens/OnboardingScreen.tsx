import React, { useState, useRef } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import client from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useIntentStore, type SessionIntent } from '../store/intentStore';
import { normalizeApiError } from '../api/errors';
import AppButton from '../components/ui/AppButton';
import AppBackButton from '../components/ui/AppBackButton';
import { useTheme } from '../theme/useTheme';
import { radii, spacing, typography } from '../theme/tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Types ──────────────────────────────────────────────────────────────────

interface OnboardingData {
  intent: SessionIntent;
  activities: string[];
  frequencyLabel: string;
  intensityLevel: string;
  weeklyFrequencyBand: string;
  environment: string[];
  schedule: string[];
  socialComfort: string;
}

// ─── Step Constants ──────────────────────────────────────────────────────────

const ACTIVITIES = [
  { key: 'lifting', label: 'Lifting', emoji: '🏋️' },
  { key: 'yoga', label: 'Yoga', emoji: '🧘' },
  { key: 'surfing', label: 'Surfing', emoji: '🏄' },
  { key: 'hiking', label: 'Hiking', emoji: '🥾' },
  { key: 'running', label: 'Running', emoji: '🏃' },
  { key: 'cycling', label: 'Cycling', emoji: '🚴' },
  { key: 'beach', label: 'Beach Workouts', emoji: '🏖️' },
  { key: 'climbing', label: 'Climbing', emoji: '🧗' },
  { key: 'skiing', label: 'Skiing', emoji: '⛷️' },
  { key: 'swimming', label: 'Swimming', emoji: '🏊' },
  { key: 'boxing', label: 'Boxing', emoji: '🥊' },
  { key: 'crossfit', label: 'CrossFit', emoji: '🤸' },
];

const FREQUENCY_OPTIONS = [
  { key: '1-2', label: '1–2x', subtitle: 'Casual mover', intensity: 'low' },
  { key: '3-4', label: '3–4x', subtitle: 'Regular athlete', intensity: 'moderate' },
  { key: '5-6', label: '5–6x', subtitle: 'Dedicated', intensity: 'high' },
  { key: '7+', label: 'Daily', subtitle: 'All-in', intensity: 'high' },
];

const ENVIRONMENTS = [
  { key: 'gym', label: 'Gym', emoji: '🏋️' },
  { key: 'outdoors', label: 'Outdoors', emoji: '🌿' },
  { key: 'beach', label: 'Beach', emoji: '🏖️' },
  { key: 'mountains', label: 'Mountains', emoji: '⛰️' },
  { key: 'city', label: 'City', emoji: '🏙️' },
  { key: 'studio', label: 'Studio', emoji: '🧘' },
];

const SCHEDULE_OPTIONS = [
  { key: 'morning', label: 'Morning', emoji: '🌅' },
  { key: 'evening', label: 'Evening', emoji: '🌙' },
  { key: 'weekends', label: 'Weekends', emoji: '📅' },
  { key: 'flexible', label: 'Flexible', emoji: '🔄' },
];

const SOCIAL_OPTIONS = [
  { key: '1-on-1', label: '1-on-1', subtitle: 'Deep focus, just us', emoji: '🤝' },
  { key: 'small-group', label: 'Small Group', subtitle: '3–5 people, tight-knit', emoji: '👥' },
  { key: 'group-first', label: 'Group First', subtitle: 'Start big, connect naturally', emoji: '🎯' },
];

const TOTAL_STEPS = 9;

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OnboardingScreen({ navigation }: any) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { setIntent } = useIntentStore();
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    intent: 'both',
    activities: [],
    frequencyLabel: '3-4',
    intensityLevel: 'moderate',
    weeklyFrequencyBand: '3-4',
    environment: [],
    schedule: [],
    socialComfort: '',
  });

  // Pulse animation for holy sh*t step
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const progress = (step + 1) / TOTAL_STEPS;

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else if (navigation.canGoBack()) navigation.goBack();
  };

  const toggleArray = (arr: string[], key: string): string[] =>
    arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key];

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await client.put('/profile/fitness', {
        intensityLevel: data.intensityLevel,
        weeklyFrequencyBand: data.weeklyFrequencyBand,
        primaryGoal: data.intent === 'dating' ? 'connection' : data.intent === 'workout' ? 'performance' : 'both',
        favoriteActivities: data.activities.join(', '),
      });
      await setIntent(data.intent);
      if (user) setUser({ ...user, isOnboarded: true });
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error) {
      Alert.alert('Could not save profile', normalizeApiError(error).message);
    } finally {
      setSaving(false);
    }
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  };

  React.useEffect(() => {
    if (step === 8) startPulse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const renderStep = () => {
    switch (step) {
      // ── Step 0: Welcome ─────────────────────────────────────────────────
      case 0:
        return (
          <View style={styles.fullScreenStep}>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeEmoji}>🏃‍♀️</Text>
              <Text style={[styles.welcomeHeadline, { color: theme.textPrimary }]}>
                Move together.{'\n'}Meet naturally.
              </Text>
              <Text style={[styles.welcomeBody, { color: theme.textSecondary }]}>
                BRDG connects people through shared activities — not profiles. Find your people by living your lifestyle.
              </Text>
            </View>
            <View style={[styles.stepFooter, { paddingBottom: Math.max(insets.bottom + 8, spacing.xxl) }]}>
              <AppButton label="Let's go →" onPress={goNext} />
            </View>
          </View>
        );

      // ── Step 1: Intent ──────────────────────────────────────────────────
      case 1:
        return (
          <ScrollView contentContainerStyle={[styles.stepContent, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
            <Text style={[styles.stepHeadline, { color: theme.textPrimary }]}>
              What brings you to BRDG?
            </Text>
            <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
              Be honest — no judgment here.
            </Text>
            <View style={styles.intentCards}>
              {[
                { key: 'dating' as SessionIntent, icon: '❤️', title: 'Dating', sub: 'Meet someone special through shared movement' },
                { key: 'workout' as SessionIntent, icon: '💪', title: 'Workout Partner', sub: 'Find your perfect training companion' },
                { key: 'both' as SessionIntent, icon: '🔀', title: 'Both', sub: 'Open to love and lifting — why choose?' },
              ].map((opt) => {
                const selected = data.intent === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setData((d) => ({ ...d, intent: opt.key }))}
                    style={[
                      styles.intentCard,
                      {
                        backgroundColor: selected ? theme.primarySubtle : theme.surface,
                        borderColor: selected ? theme.primary : theme.border,
                        borderWidth: selected ? 2 : 1.5,
                      },
                    ]}
                  >
                    <Text style={styles.intentCardIcon}>{opt.icon}</Text>
                    <Text style={[styles.intentCardTitle, { color: selected ? theme.primary : theme.textPrimary }]}>
                      {opt.title}
                    </Text>
                    <Text style={[styles.intentCardSub, { color: theme.textSecondary }]}>{opt.sub}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.stepFooter, { paddingBottom: Math.max(insets.bottom + 8, spacing.xxl) }]}>
              <AppButton label="Continue" onPress={goNext} />
            </View>
          </ScrollView>
        );

      // ── Step 2: Movement Identity ────────────────────────────────────────
      case 2:
        return (
          <ScrollView contentContainerStyle={[styles.stepContent, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
            <Text style={[styles.stepHeadline, { color: theme.textPrimary }]}>
              How do you like to move?
            </Text>
            <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
              Select all that define you.
            </Text>
            <View style={styles.activityGrid}>
              {ACTIVITIES.map((act) => {
                const selected = data.activities.includes(act.key);
                return (
                  <Pressable
                    key={act.key}
                    onPress={() => setData((d) => ({ ...d, activities: toggleArray(d.activities, act.key) }))}
                    style={[
                      styles.activityTile,
                      {
                        backgroundColor: selected ? theme.primarySubtle : theme.surface,
                        borderColor: selected ? theme.primary : theme.border,
                        borderWidth: selected ? 2 : 1.5,
                      },
                    ]}
                  >
                    <Text style={styles.activityEmoji}>{act.emoji}</Text>
                    <Text style={[styles.activityLabel, { color: selected ? theme.primary : theme.textPrimary }]}>
                      {act.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.stepFooter, { paddingBottom: Math.max(insets.bottom + 8, spacing.xxl) }]}>
              <AppButton label="Continue" onPress={goNext} disabled={data.activities.length === 0} />
            </View>
          </ScrollView>
        );

      // ── Step 3: Energy Level ─────────────────────────────────────────────
      case 3:
        return (
          <ScrollView contentContainerStyle={[styles.stepContent, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
            <Text style={[styles.stepHeadline, { color: theme.textPrimary }]}>
              How often do you train?
            </Text>
            <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
              Helps us find compatible schedules.
            </Text>
            <View style={styles.largeCards}>
              {FREQUENCY_OPTIONS.map((opt) => {
                const selected = data.frequencyLabel === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() =>
                      setData((d) => ({
                        ...d,
                        frequencyLabel: opt.key,
                        weeklyFrequencyBand: opt.key,
                        intensityLevel: opt.intensity,
                      }))
                    }
                    style={[
                      styles.largeCard,
                      {
                        backgroundColor: selected ? theme.primarySubtle : theme.surface,
                        borderColor: selected ? theme.primary : theme.border,
                        borderWidth: selected ? 2 : 1.5,
                      },
                    ]}
                  >
                    <Text style={[styles.largeCardLabel, { color: selected ? theme.primary : theme.textPrimary }]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.largeCardSub, { color: theme.textSecondary }]}>{opt.subtitle}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.stepFooter, { paddingBottom: Math.max(insets.bottom + 8, spacing.xxl) }]}>
              <AppButton label="Continue" onPress={goNext} />
            </View>
          </ScrollView>
        );

      // ── Step 4: Environment ──────────────────────────────────────────────
      case 4:
        return (
          <ScrollView contentContainerStyle={[styles.stepContent, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
            <Text style={[styles.stepHeadline, { color: theme.textPrimary }]}>
              Where do you feel most alive?
            </Text>
            <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
              Pick all that resonate.
            </Text>
            <View style={styles.activityGrid}>
              {ENVIRONMENTS.map((env) => {
                const selected = data.environment.includes(env.key);
                return (
                  <Pressable
                    key={env.key}
                    onPress={() => setData((d) => ({ ...d, environment: toggleArray(d.environment, env.key) }))}
                    style={[
                      styles.activityTile,
                      {
                        backgroundColor: selected ? theme.accentSubtle : theme.surface,
                        borderColor: selected ? theme.accent : theme.border,
                        borderWidth: selected ? 2 : 1.5,
                      },
                    ]}
                  >
                    <Text style={styles.activityEmoji}>{env.emoji}</Text>
                    <Text style={[styles.activityLabel, { color: selected ? theme.accent : theme.textPrimary }]}>
                      {env.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.stepFooter, { paddingBottom: Math.max(insets.bottom + 8, spacing.xxl) }]}>
              <AppButton label="Continue" onPress={goNext} disabled={data.environment.length === 0} />
            </View>
          </ScrollView>
        );

      // ── Step 5: Schedule ─────────────────────────────────────────────────
      case 5:
        return (
          <ScrollView contentContainerStyle={[styles.stepContent, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
            <Text style={[styles.stepHeadline, { color: theme.textPrimary }]}>
              When do you prefer to move?
            </Text>
            <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
              Select all that apply.
            </Text>
            <View style={styles.largeCards}>
              {SCHEDULE_OPTIONS.map((opt) => {
                const selected = data.schedule.includes(opt.key);
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setData((d) => ({ ...d, schedule: toggleArray(d.schedule, opt.key) }))}
                    style={[
                      styles.scheduleCard,
                      {
                        backgroundColor: selected ? theme.accentSubtle : theme.surface,
                        borderColor: selected ? theme.accent : theme.border,
                        borderWidth: selected ? 2 : 1.5,
                      },
                    ]}
                  >
                    <Text style={styles.scheduleEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.largeCardLabel, { color: selected ? theme.accent : theme.textPrimary }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.stepFooter, { paddingBottom: Math.max(insets.bottom + 8, spacing.xxl) }]}>
              <AppButton label="Continue" onPress={goNext} disabled={data.schedule.length === 0} />
            </View>
          </ScrollView>
        );

      // ── Step 6: Social Comfort ───────────────────────────────────────────
      case 6:
        return (
          <ScrollView contentContainerStyle={[styles.stepContent, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
            <Text style={[styles.stepHeadline, { color: theme.textPrimary }]}>
              How do you prefer to meet?
            </Text>
            <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
              No wrong answer here.
            </Text>
            <View style={styles.socialCards}>
              {SOCIAL_OPTIONS.map((opt) => {
                const selected = data.socialComfort === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setData((d) => ({ ...d, socialComfort: opt.key }))}
                    style={[
                      styles.socialCard,
                      {
                        backgroundColor: selected ? theme.primarySubtle : theme.surface,
                        borderColor: selected ? theme.primary : theme.border,
                        borderWidth: selected ? 2 : 1.5,
                      },
                    ]}
                  >
                    <Text style={styles.socialCardEmoji}>{opt.emoji}</Text>
                    <View style={styles.socialCardText}>
                      <Text style={[styles.socialCardTitle, { color: selected ? theme.primary : theme.textPrimary }]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.socialCardSub, { color: theme.textSecondary }]}>{opt.subtitle}</Text>
                    </View>
                    {selected && (
                      <View style={[styles.checkDot, { backgroundColor: theme.primary }]}>
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.stepFooter, { paddingBottom: Math.max(insets.bottom + 8, spacing.xxl) }]}>
              <AppButton label="Continue" onPress={goNext} disabled={!data.socialComfort} />
            </View>
          </ScrollView>
        );

      // ── Step 7: Profile Summary ──────────────────────────────────────────
      case 7:
        const intentLabel = data.intent === 'dating' ? '❤️ Dating' : data.intent === 'workout' ? '💪 Workout' : '🔀 Both';
        const freqOpt = FREQUENCY_OPTIONS.find((f) => f.key === data.frequencyLabel);
        return (
          <ScrollView contentContainerStyle={[styles.stepContent, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
            <Text style={[styles.stepHeadline, { color: theme.textPrimary }]}>
              This is you{'\n'}on BRDG.
            </Text>
            <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
              Your movement identity — authentic and yours.
            </Text>

            <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <SummaryRow
                label="Intent"
                value={intentLabel}
                accent={theme.primary}
                textMuted={theme.textMuted}
                textPrimary={theme.textPrimary}
              />
              <SummaryDivider color={theme.border} />
              <SummaryRow
                label="Movement"
                value={data.activities.slice(0, 4).map((k) => ACTIVITIES.find((a) => a.key === k)?.label || k).join(' · ')}
                accent={theme.primary}
                textMuted={theme.textMuted}
                textPrimary={theme.textPrimary}
              />
              <SummaryDivider color={theme.border} />
              <SummaryRow
                label="Trains"
                value={freqOpt ? `${freqOpt.label} / week` : data.frequencyLabel}
                accent={theme.accent}
                textMuted={theme.textMuted}
                textPrimary={theme.textPrimary}
              />
              <SummaryDivider color={theme.border} />
              <SummaryRow
                label="Environment"
                value={data.environment.map((k) => ENVIRONMENTS.find((e) => e.key === k)?.label || k).join(' · ')}
                accent={theme.accent}
                textMuted={theme.textMuted}
                textPrimary={theme.textPrimary}
              />
              <SummaryDivider color={theme.border} />
              <SummaryRow
                label="Schedule"
                value={data.schedule.map((k) => SCHEDULE_OPTIONS.find((s) => s.key === k)?.label || k).join(' · ')}
                accent={theme.accent}
                textMuted={theme.textMuted}
                textPrimary={theme.textPrimary}
              />
            </View>
            <View style={[styles.stepFooter, { paddingBottom: Math.max(insets.bottom + 8, spacing.xxl) }]}>
              <AppButton label="That's me →" onPress={goNext} />
            </View>
          </ScrollView>
        );

      // ── Step 8: Holy Sh*t Moment ─────────────────────────────────────────
      case 8:
        return (
          <View style={styles.fullScreenStep}>
            <View style={styles.holyShitContent}>
              <Animated.View style={[styles.countBadge, { backgroundColor: theme.primary, transform: [{ scale: pulseAnim }] }]}>
                <Text style={[styles.countNumber, { color: theme.white }]}>8</Text>
                <Text style={[styles.countLabel, { color: theme.white }]}>near you</Text>
              </Animated.View>

              <Text style={[styles.holyShitHeadline, { color: theme.textPrimary }]}>
                People who share{'\n'}your lifestyle.
              </Text>
              <Text style={[styles.holyShitBody, { color: theme.textSecondary }]}>
                BRDG found 8 people near you with matching activities, schedule, and vibe.
              </Text>

              {/* Blurred avatar grid */}
              <View style={styles.avatarGrid}>
                {[...Array(8)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.avatarBlur,
                      {
                        backgroundColor: i % 2 === 0 ? theme.primarySubtle : theme.accentSubtle,
                        borderColor: i % 2 === 0 ? theme.primary : theme.accent,
                      },
                    ]}
                  >
                    <Text style={styles.avatarEmoji}>
                      {['🏃', '🧘', '🏋️', '🚴', '🏄', '🥾', '🧗', '🏊'][i]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.stepFooter, { paddingBottom: Math.max(insets.bottom + 8, spacing.xxl) }]}>
              <AppButton
                label={saving ? 'Setting up your profile…' : 'Meet them now ✦'}
                onPress={handleSubmit}
                loading={saving}
                disabled={saving}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.primary,
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>

      {/* Back button */}
      {step > 0 && (
        <View style={styles.backButtonRow}>
          <AppBackButton onPress={goBack} disabled={saving} style={{ marginBottom: 0 }} />
        </View>
      )}

      {renderStep()}
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  accent,
  textMuted,
  textPrimary,
}: {
  label: string;
  value: string;
  accent: string;
  textMuted: string;
  textPrimary: string;
}) {
  return (
    <View style={summaryStyles.row}>
      <Text style={[summaryStyles.label, { color: textMuted }]}>{label.toUpperCase()}</Text>
      <Text style={[summaryStyles.value, { color: textPrimary }]} numberOfLines={2}>
        {value || '—'}
      </Text>
    </View>
  );
}

function SummaryDivider({ color }: { color: string }) {
  return <View style={[summaryStyles.divider, { backgroundColor: color }]} />;
}

const summaryStyles = StyleSheet.create({
  row: {
    paddingVertical: spacing.md,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    opacity: 0.6,
  },
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  progressTrack: {
    height: 3,
    width: '100%',
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },

  backButtonRow: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },

  // Full-screen steps (Welcome + Holy Sh*t)
  fullScreenStep: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
  },

  // Scroll steps
  stepContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
  },

  stepHeadline: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 42,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: typography.body,
    lineHeight: 24,
    marginBottom: spacing.xxxl,
  },

  stepFooter: {
    paddingTop: spacing.md,
  },

  // ── Welcome step ─────────────────────────────────────────────────────────
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  welcomeHeadline: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.2,
    lineHeight: 50,
  },
  welcomeBody: {
    fontSize: typography.h3,
    lineHeight: 30,
    fontWeight: '400',
  },

  // ── Intent cards ──────────────────────────────────────────────────────────
  intentCards: {
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  intentCard: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  intentCardIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  intentCardTitle: {
    fontSize: typography.h3,
    fontWeight: '800',
  },
  intentCardSub: {
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },

  // ── Activity grid ─────────────────────────────────────────────────────────
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  activityTile: {
    width: '30%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
    minWidth: 90,
  },
  activityEmoji: {
    fontSize: 28,
  },
  activityLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ── Large cards (frequency / social) ─────────────────────────────────────
  largeCards: {
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  largeCard: {
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: 4,
  },
  largeCardLabel: {
    fontSize: typography.h3,
    fontWeight: '800',
  },
  largeCardSub: {
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },

  // ── Schedule cards ────────────────────────────────────────────────────────
  scheduleCard: {
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scheduleEmoji: {
    fontSize: 24,
  },

  // ── Social cards ──────────────────────────────────────────────────────────
  socialCards: {
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  socialCard: {
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  socialCardEmoji: {
    fontSize: 28,
  },
  socialCardText: {
    flex: 1,
  },
  socialCardTitle: {
    fontSize: typography.h3,
    fontWeight: '800',
    marginBottom: 2,
  },
  socialCardSub: {
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  checkDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Summary card ──────────────────────────────────────────────────────────
  summaryCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxxl,
  },

  // ── Holy sh*t step ────────────────────────────────────────────────────────
  holyShitContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  countBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  countNumber: {
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 52,
  },
  countLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  holyShitHeadline: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 42,
    textAlign: 'center',
  },
  holyShitBody: {
    fontSize: typography.body,
    lineHeight: 26,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    maxWidth: 280,
  },
  avatarBlur: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
});
