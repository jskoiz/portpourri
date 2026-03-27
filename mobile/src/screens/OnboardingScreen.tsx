import React, { useEffect, useRef } from 'react';
import { Alert, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/authStore';
import { useProfile } from '../features/profile/hooks/useProfile';
import { normalizeApiError } from '../api/errors';
import { normalizeIntensityLevelForApi } from '../api/profileIntensity';
import { useStepFlow } from '../components/form/useStepFlow';
import { useTheme } from '../theme/useTheme';
import type { RootStackScreenProps } from '../core/navigation/types';
import { onboardingSchema } from '../features/onboarding/schema';
import {
  ACTIVITIES,
  OnboardingFlowShell,
} from '../features/onboarding/components';
import { ONBOARDING_STEP_DEFINITIONS } from '../features/onboarding/components/stepDefinitions';
import type { OnboardingData } from '../features/onboarding/components';

export default function OnboardingScreen({
  navigation,
}: RootStackScreenProps<'Onboarding'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);
  const { profile, updateFitness, updateProfile } = useProfile();
  const totalSteps = ONBOARDING_STEP_DEFINITIONS.length;
  const { goToStep, isFirstStep, isLastStep, step } = useStepFlow({ totalSteps });
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<OnboardingData>({
    defaultValues: {
      intent: 'both',
      discoveryPreference: 'both',
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

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const currentStep = ONBOARDING_STEP_DEFINITIONS[step];

  const progress = (step + 1) / totalSteps;

  const toggleArray = (arr: string[], key: string): string[] =>
    arr.includes(key) ? arr.filter((item) => item !== key) : [...arr, key];

  const transitionToStep = (nextStep: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      goToStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const goNext = () => {
    if (!isLastStep) transitionToStep(step + 1);
  };

  const goBack = () => {
    if (!isFirstStep) transitionToStep(step - 1);
    else if (navigation.canGoBack()) navigation.goBack();
  };

  const submitOnboarding = handleSubmit(
    async (values) => {
      try {
        const showMeMen = values.discoveryPreference === 'men' || values.discoveryPreference === 'both';
        const showMeWomen = values.discoveryPreference === 'women' || values.discoveryPreference === 'both';

        await updateProfile({
          showMeMen,
          showMeWomen,
        });
        await updateFitness({
          intensityLevel: normalizeIntensityLevelForApi(values.intensityLevel),
          weeklyFrequencyBand: values.weeklyFrequencyBand,
          primaryGoal:
            values.intent === 'dating'
              ? 'connection'
              : values.intent === 'workout'
                ? 'performance'
                : 'both',
          favoriteActivities: values.activities
            .map((key) => ACTIVITIES.find((activity) => activity.key === key)?.label ?? key)
            .join(', '),
          prefersMorning: values.schedule.includes('morning'),
          prefersEvening: values.schedule.includes('evening'),
        });
        if (profile) {
          setUser({ ...profile, isOnboarded: true });
        } else if (user) {
          setUser({ ...user, isOnboarded: true });
        }
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      } catch (error) {
        Alert.alert('Could not save profile', normalizeApiError(error).message);
      }
    },
    (errors) => {
      const firstError = Object.values(errors)[0];
      const message = firstError?.message ?? 'Please complete all steps before continuing.';
      Alert.alert('Missing info', String(message));
    },
  );

  useEffect(() => {
    pulseLoopRef.current?.stop();
    pulseLoopRef.current = null;
    pulseAnim.setValue(1);

    if (!isLastStep) {
      return undefined;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
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
  }, [isLastStep, pulseAnim, step]);

  return (
    <OnboardingFlowShell
      chapter={currentStep.chapter}
      contentOpacity={fadeAnim}
      isSubmitting={isSubmitting}
      onBack={goBack}
      progress={progress}
      showBackButton={currentStep.showBackButton}
    >
      {currentStep.render({
        data,
        goNext,
        insets,
        isSubmitting,
        pulseAnim,
        setValue,
        submitOnboarding,
        theme,
        toggleArray,
      })}
    </OnboardingFlowShell>
  );
}
