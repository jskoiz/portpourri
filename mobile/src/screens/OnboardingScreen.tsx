import React, { useState, useRef } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/authStore';
import { useProfile } from '../features/profile/hooks/useProfile';
import { normalizeApiError } from '../api/errors';
import { Button } from '../design/primitives';
import AppBackButton from '../components/ui/AppBackButton';
import AppIcon from '../components/ui/AppIcon';
import AppBackdrop from '../components/ui/AppBackdrop';
import { useTheme } from '../theme/useTheme';
import { spacing } from '../theme/tokens';
import { type SessionIntent } from '../types/sessionIntent';
import type { RootStackScreenProps } from '../core/navigation/types';
import { onboardingSchema } from '../features/onboarding/schema';
import { styles, summaryStyles } from '../features/onboarding/onboarding.styles';

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
  { key: 'lifting', label: 'Lifting', icon: 'activity' },
  { key: 'yoga', label: 'Yoga', icon: 'circle' },
  { key: 'surfing', label: 'Surfing', icon: 'wind' },
  { key: 'hiking', label: 'Hiking', icon: 'map' },
  { key: 'running', label: 'Running', icon: 'activity' },
  { key: 'cycling', label: 'Cycling', icon: 'navigation' },
  { key: 'beach', label: 'Beach Workouts', icon: 'sun' },
  { key: 'climbing', label: 'Climbing', icon: 'triangle' },
  { key: 'skiing', label: 'Skiing', icon: 'navigation-2' },
  { key: 'swimming', label: 'Swimming', icon: 'droplet' },
  { key: 'boxing', label: 'Boxing', icon: 'target' },
  { key: 'crossfit', label: 'CrossFit', icon: 'shuffle' },
];

const FREQUENCY_OPTIONS = [
  { key: '1-2', label: '1–2x', subtitle: 'Casual mover', intensity: 'low' },
  { key: '3-4', label: '3–4x', subtitle: 'Regular athlete', intensity: 'moderate' },
  { key: '5-6', label: '5–6x', subtitle: 'Dedicated', intensity: 'high' },
  { key: '7+', label: 'Daily', subtitle: 'All-in', intensity: 'high' },
];

const ENVIRONMENTS = [
  { key: 'gym', label: 'Gym', icon: 'activity' },
  { key: 'outdoors', label: 'Outdoors', icon: 'compass' },
  { key: 'beach', label: 'Beach', icon: 'sun' },
  { key: 'mountains', label: 'Mountains', icon: 'triangle' },
  { key: 'city', label: 'City', icon: 'grid' },
  { key: 'studio', label: 'Studio', icon: 'circle' },
];

const SCHEDULE_OPTIONS = [
  { key: 'morning', label: 'Morning', icon: 'sun' },
  { key: 'evening', label: 'Evening', icon: 'moon' },
  { key: 'weekends', label: 'Weekends', icon: 'calendar' },
  { key: 'flexible', label: 'Flexible', icon: 'refresh-cw' },
];

const SOCIAL_OPTIONS = [
  { key: '1-on-1', label: '1-on-1', subtitle: 'Deep focus, just us', icon: 'user' },
  { key: 'small-group', label: 'Small Group', subtitle: '3–5 people, tight-knit', icon: 'users' },
  { key: 'group-first', label: 'Group First', subtitle: 'Start big, connect naturally', icon: 'target' },
];

const STEP_CHAPTERS = [
  'Welcome',
  'Intent',
  'Activities',
  'Frequency',
  'Environment',
  'Schedule',
  'Social',
  'Summary',
  'Ready',
] as const;

const TOTAL_STEPS = 9;

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OnboardingScreen({
  navigation,
}: RootStackScreenProps<'Onboarding'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);
  const { updateFitness } = useProfile();

  const [step, setStep] = useState(0);
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<OnboardingData>({
    defaultValues: {
      intent: 'both',
      activities: [],
      frequencyLabel: '3-4',
      intensityLevel: 'moderate',
      weeklyFrequencyBand: '3-4',
      environment: [],
      schedule: [],
      socialComfort: '',
    },
    resolver: zodResolver(onboardingSchema),
  });
  const data = watch();

  // Pulse animation for holy sh*t step
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Fade transition between steps
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const progress = (step + 1) / TOTAL_STEPS;

  const transitionToStep = (nextStep: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) transitionToStep(step + 1);
  };

  const goBack = () => {
    if (step > 0) transitionToStep(step - 1);
    else if (navigation.canGoBack()) navigation.goBack();
  };

  const toggleArray = (arr: string[], key: string): string[] =>
    arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key];

  const submitOnboarding = handleSubmit(async (values) => {
    try {
      const favoriteActivities = values.activities
        .map((key) => ACTIVITIES.find((activity) => activity.key === key)?.label ?? key)
        .join(', ');

      await updateFitness({
        intensityLevel: values.intensityLevel,
        weeklyFrequencyBand: values.weeklyFrequencyBand,
        primaryGoal:
          values.intent === 'dating'
            ? 'connection'
            : values.intent === 'workout'
              ? 'performance'
              : 'both',
        favoriteActivities,
        prefersMorning: values.schedule.includes('morning'),
        prefersEvening: values.schedule.includes('evening'),
      });
      if (user) setUser({ ...user, isOnboarded: true });
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error) {
      Alert.alert('Could not save profile', normalizeApiError(error).message);
    }
  });

  React.useEffect(() => {
    pulseLoopRef.current?.stop();
    pulseLoopRef.current = null;
    pulseAnim.setValue(1);

    if (step !== 8) {
      return undefined;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );

    pulseLoopRef.current = pulseLoop;
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
      if (pulseLoopRef.current === pulseLoop) {
        pulseLoopRef.current = null;
      }
      pulseAnim.setValue(1);
    };
  }, [pulseAnim, step]);

  const renderStep = () => {
    switch (step) {
      // ── Step 0: Welcome ─────────────────────────────────────────────────
      case 0:
        return (
          <View style={styles.fullScreenStep}>
            <View style={styles.welcomeContent}>
              <View style={[styles.welcomeIconWrap, { backgroundColor: theme.primarySubtle }]}>
                <AppIcon name="activity" size={30} color={theme.primary} />
              </View>
              <Text style={[styles.welcomeHeadline, { color: theme.textPrimary }]}>
                Welcome to BRDG
              </Text>
              <Text style={[styles.welcomeBody, { color: theme.textSecondary }]}>
                Connect with people through the activities you love.
              </Text>
            </View>
            <View style={[styles.stepFooter, { paddingBottom: Math.max(insets.bottom + 8, spacing.xxl) }]}>
              <Button label="Get started" onPress={goNext} />
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
              This helps us personalize your feed.
            </Text>
            <View style={styles.intentCards}>
              {[
                { key: 'dating' as SessionIntent, icon: 'heart', title: 'Dating', sub: 'Meet someone special through shared movement' },
                { key: 'workout' as SessionIntent, icon: 'activity', title: 'Training Partner', sub: 'Find your perfect training companion' },
                { key: 'both' as SessionIntent, icon: 'shuffle', title: 'Open to both', sub: 'Keep it open to chemistry and momentum.' },
              ].map((opt) => {
                const selected = data.intent === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setValue('intent', opt.key)}
                    style={[
                      styles.intentCard,
                      {
                        backgroundColor: selected ? theme.primarySubtle : theme.surface,
                        borderColor: selected ? theme.primary : theme.border,
                        borderWidth: selected ? 2 : 1.5,
                        minHeight: 56,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${opt.title}. ${opt.sub}`}
                  >
                    <View style={[styles.intentCardIconWrap, { backgroundColor: selected ? theme.primarySubtle : theme.surfaceElevated }]}>
                      <AppIcon name={opt.icon} size={18} color={selected ? theme.primary : theme.textSecondary} />
                    </View>
                    <Text style={[styles.intentCardTitle, { color: selected ? theme.primary : theme.textPrimary }]}>
                      {opt.title}
                    </Text>
                    <Text style={[styles.intentCardSub, { color: theme.textSecondary }]}>{opt.sub}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.stepFooter, { paddingBottom: Math.max(insets.bottom + 8, spacing.xxl) }]}>
              <Button label="Continue" onPress={goNext} />
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
              Pick all that apply.
            </Text>
            <View style={styles.activityGrid}>
              {ACTIVITIES.map((act) => {
                const selected = data.activities.includes(act.key);
                return (
                  <Pressable
                    key={act.key}
                    onPress={() =>
                      setValue('activities', toggleArray(data.activities, act.key))
                    }
                    style={[
                      styles.activityTile,
                      {
                        backgroundColor: selected ? theme.primarySubtle : theme.surface,
                        borderColor: selected ? theme.primary : theme.border,
                        borderWidth: selected ? 2 : 1.5,
                      },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={act.label}
                  >
                    <View style={[styles.activityIconWrap, { backgroundColor: selected ? theme.primarySubtle : theme.surfaceElevated }]}>
                      <AppIcon name={act.icon} size={16} color={selected ? theme.primary : theme.textSecondary} />
                    </View>
                    <Text style={[styles.activityLabel, { color: selected ? theme.primary : theme.textPrimary }]}>
                      {act.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.stepFooter, { paddingBottom: Math.max(insets.bottom + 8, spacing.xxl) }]}>
              <Button label="Continue" onPress={goNext} disabled={data.activities.length === 0} />
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
              We'll match you with similar energy.
            </Text>
            <View style={styles.largeCards}>
              {FREQUENCY_OPTIONS.map((opt) => {
                const selected = data.frequencyLabel === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() =>
                      {
                        setValue('frequencyLabel', opt.key);
                        setValue('weeklyFrequencyBand', opt.key);
                        setValue('intensityLevel', opt.intensity);
                      }
                    }
                    style={[
                      styles.largeCard,
                      {
                        backgroundColor: selected ? theme.primarySubtle : theme.surface,
                        borderColor: selected ? theme.primary : theme.border,
                        borderWidth: selected ? 2 : 1.5,
                        minHeight: 48,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${opt.label} per week. ${opt.subtitle}`}
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
              <Button label="Continue" onPress={goNext} />
            </View>
          </ScrollView>
        );

      // ── Step 4: Environment ──────────────────────────────────────────────
      case 4:
        return (
          <ScrollView contentContainerStyle={[styles.stepContent, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
            <Text style={[styles.stepHeadline, { color: theme.textPrimary }]}>
              Where do you like to train?
            </Text>
            <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
              Pick all that apply.
            </Text>
            <View style={styles.activityGrid}>
              {ENVIRONMENTS.map((env) => {
                const selected = data.environment.includes(env.key);
                return (
                  <Pressable
                    key={env.key}
                    onPress={() =>
                      setValue('environment', toggleArray(data.environment, env.key))
                    }
                    style={[
                      styles.activityTile,
                      {
                        backgroundColor: selected ? theme.accentSubtle : theme.surface,
                        borderColor: selected ? theme.accent : theme.border,
                        borderWidth: selected ? 2 : 1.5,
                      },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={env.label}
                  >
                    <View style={[styles.activityIconWrap, { backgroundColor: selected ? theme.accentSubtle : theme.surfaceElevated }]}>
                      <AppIcon name={env.icon} size={16} color={selected ? theme.accent : theme.textSecondary} />
                    </View>
                    <Text style={[styles.activityLabel, { color: selected ? theme.accent : theme.textPrimary }]}>
                      {env.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.stepFooter, { paddingBottom: Math.max(insets.bottom + 8, spacing.xxl) }]}>
              <Button label="Continue" onPress={goNext} disabled={data.environment.length === 0} />
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
                    onPress={() =>
                      setValue('schedule', toggleArray(data.schedule, opt.key))
                    }
                    style={[
                      styles.scheduleCard,
                      {
                        backgroundColor: selected ? theme.accentSubtle : theme.surface,
                        borderColor: selected ? theme.accent : theme.border,
                        borderWidth: selected ? 2 : 1.5,
                        minHeight: 48,
                      },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={opt.label}
                  >
                    <View style={[styles.scheduleIconWrap, { backgroundColor: selected ? theme.accentSubtle : theme.surfaceElevated }]}>
                      <AppIcon name={opt.icon} size={16} color={selected ? theme.accent : theme.textSecondary} />
                    </View>
                    <Text style={[styles.largeCardLabel, { color: selected ? theme.accent : theme.textPrimary }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.stepFooter, { paddingBottom: Math.max(insets.bottom + 8, spacing.xxl) }]}>
              <Button label="Continue" onPress={goNext} disabled={data.schedule.length === 0} />
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
              How you prefer to connect.
            </Text>
            <View style={styles.socialCards}>
              {SOCIAL_OPTIONS.map((opt) => {
                const selected = data.socialComfort === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setValue('socialComfort', opt.key)}
                    style={[
                      styles.socialCard,
                      {
                        backgroundColor: selected ? theme.primarySubtle : theme.surface,
                        borderColor: selected ? theme.primary : theme.border,
                        borderWidth: selected ? 2 : 1.5,
                        minHeight: 56,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${opt.label}. ${opt.subtitle}`}
                  >
                    <View style={[styles.socialCardIconWrap, { backgroundColor: selected ? theme.primarySubtle : theme.surfaceElevated }]}>
                      <AppIcon name={opt.icon} size={16} color={selected ? theme.primary : theme.textSecondary} />
                    </View>
                    <View style={styles.socialCardText}>
                      <Text style={[styles.socialCardTitle, { color: selected ? theme.primary : theme.textPrimary }]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.socialCardSub, { color: theme.textSecondary }]}>{opt.subtitle}</Text>
                    </View>
                    {selected && (
                      <View style={[styles.checkDot, { backgroundColor: theme.primary }]}>
                        <AppIcon name="check" size={12} color={theme.textInverse} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.stepFooter, { paddingBottom: Math.max(insets.bottom + 8, spacing.xxl) }]}>
              <Button label="Continue" onPress={goNext} disabled={!data.socialComfort} />
            </View>
          </ScrollView>
        );

      // ── Step 7: Profile Summary ──────────────────────────────────────────
      case 7: {
        const intentLabel = data.intent === 'dating' ? 'Dating' : data.intent === 'workout' ? 'Training' : 'Open to both';
        const freqOpt = FREQUENCY_OPTIONS.find((f) => f.key === data.frequencyLabel);
        return (
          <ScrollView contentContainerStyle={[styles.stepContent, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
            <Text style={[styles.stepHeadline, { color: theme.textPrimary }]}>
              Your profile
            </Text>
            <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
              Here's a summary of what you told us.
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
              <Button label="Looks good" onPress={goNext} />
            </View>
          </ScrollView>
        );
      }

      // ── Step 8: Final Step ───────────────────────────────────────────────
      case 8:
        return (
          <View style={styles.fullScreenStep}>
            <View style={styles.holyShitContent}>
              <Animated.View style={[styles.countBadge, { backgroundColor: theme.primary, transform: [{ scale: pulseAnim }] }]}>
                <AppIcon name="users" size={36} color={theme.white} />
                <Text style={[styles.countLabel, { color: theme.white }]}>near you</Text>
              </Animated.View>

              <Text style={[styles.holyShitHeadline, { color: theme.textPrimary }]}>
                People near you
              </Text>
              <Text style={[styles.holyShitBody, { color: theme.textSecondary }]}>
                People near you are waiting with matching activities, schedule, and vibe.
              </Text>

              {/* Blurred avatar grid */}
              <View style={styles.avatarGrid}>
                {(['activity', 'circle', 'wind', 'map', 'triangle'] as const).map((iconName, i) => (
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
                    <AppIcon
                      name={iconName}
                      size={18}
                      color={i % 2 === 0 ? theme.primary : theme.accent}
                    />
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.stepFooter, { paddingBottom: Math.max(insets.bottom + 8, spacing.xxl) }]}>
              <Button
                label={isSubmitting ? 'Setting up your profile…' : 'Meet them now'}
                onPress={submitOnboarding}
                loading={isSubmitting}
                disabled={isSubmitting}
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
      <AppBackdrop />

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
          <AppBackButton onPress={goBack} disabled={isSubmitting} style={{ marginBottom: 0 }} />
        </View>
      )}

      <View style={styles.shellHeader}>
        <Text style={[styles.chapterLabel, { color: theme.accent }]}>{STEP_CHAPTERS[step]}</Text>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {renderStep()}
      </Animated.View>
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

