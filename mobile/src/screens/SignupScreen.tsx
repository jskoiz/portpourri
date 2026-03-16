import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Controller,
  useForm,
  type Control,
  type FieldErrors,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/authStore';
import { normalizeApiError } from '../api/errors';
import { DateField } from '../components/form/DateField';
import { SheetSelectField } from '../components/form/SheetSelectField';
import AppBackButton from '../components/ui/AppBackButton';
import AppBackdrop from '../components/ui/AppBackdrop';
import { Button, GlassView, Input } from '../design/primitives';
import { GENDER_OPTIONS } from '../constants/signup';
import { useTheme } from '../theme/useTheme';
import { radii, spacing, typography } from '../theme/tokens';
import {
  signupSchema,
  type SignupFormValues,
} from '../features/auth/schema';
import type { RootStackScreenProps } from '../core/navigation/types';

const STEPS = 3;
const STEP_LABELS = ['Account', 'Profile', 'Done'];
const STEP_TITLES = ["Let's start with you.", 'Secure your account.', 'One last thing.'];
const STEP_SUBTITLES = [
  'Your name, so we can greet you right.',
  'Your email and a strong password.',
  'Your birthday and how you identify.',
];

export type SignupScreenViewProps = {
  canProceed: boolean;
  control: Control<SignupFormValues>;
  errors: FieldErrors<SignupFormValues>;
  isSubmitting: boolean;
  onBack: () => void;
  onNavigateLogin: () => void;
  onSubmitStep: () => void;
  step: number;
};

export function SignupScreenView({
  canProceed,
  control,
  errors,
  isSubmitting,
  onBack,
  onNavigateLogin,
  onSubmitStep,
  step,
}: SignupScreenViewProps) {
  const theme = useTheme();
  const birthdateError = errors.birthdate?.message;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppBackdrop />

          <AppBackButton
            onPress={onBack}
            disabled={isSubmitting}
          />

          <GlassView tier="light" tint={theme.accentSubtle} borderRadius={999} style={styles.brandStrip}>
            <Text style={[styles.brandStripText, { color: theme.accent }]}>JOIN BRDG / SELECTIVE ENTRY</Text>
          </GlassView>

          <View style={styles.progressRow}>
            {Array.from({ length: STEPS }).map((_, i) => (
              <View key={i} style={styles.progressItem}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: i < step ? theme.primary : i === step ? theme.primary : theme.border,
                      width: i === step ? 28 : 8,
                      opacity: i < step ? 0.5 : 1,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.dotLabel,
                    {
                      color: i === step ? theme.primary : theme.textMuted,
                      fontWeight: i === step ? '700' : '500',
                    },
                  ]}
                >
                  {STEP_LABELS[i]}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.stepHeader}>
            <Text style={[styles.stepNum, { color: theme.accent }]}>
              Step {step + 1} of {STEPS}
            </Text>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{STEP_TITLES[step]}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{STEP_SUBTITLES[step]}</Text>
          </View>

          <GlassView tier="frosted" borderRadius={radii.xxl} specularHighlight style={styles.formCard}>
            <Text style={[styles.formKicker, { color: theme.textMuted }]}>{STEP_LABELS[step].toUpperCase()}</Text>
            {step === 0 && (
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onBlur, onChange, value } }) => (
                  <Input
                    label="First name"
                    placeholder="Alex"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    editable={!isSubmitting}
                    error={errors.firstName?.message}
                    autoFocus
                    autoCapitalize="words"
                    autoComplete="given-name"
                    textContentType="givenName"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => {
                      void onSubmitStep();
                    }}
                  />
                )}
              />
            )}
            {step === 1 && (
              <>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <Input
                      label="Email"
                      placeholder="you@example.com"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      autoCapitalize="none"
                      autoComplete="email"
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      editable={!isSubmitting}
                      error={errors.email?.message}
                      autoFocus
                      returnKeyType="next"
                      submitBehavior="submit"
                      onSubmitEditing={() => {
                        void onSubmitStep();
                      }}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <Input
                      label="Password"
                      placeholder="At least 8 characters"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      secureTextEntry
                      editable={!isSubmitting}
                      error={errors.password?.message}
                      autoCapitalize="none"
                      autoComplete="new-password"
                      textContentType="newPassword"
                      returnKeyType="done"
                      submitBehavior="submit"
                      onSubmitEditing={() => {
                        void onSubmitStep();
                      }}
                    />
                  )}
                />
              </>
            )}
            {step === 2 && (
              <>
                <Controller
                  control={control}
                  name="birthdate"
                  render={({ field: { onChange, value } }) => (
                    <DateField
                      label="Birthday"
                      placeholder="Choose your birthdate"
                      value={value}
                      onChange={onChange}
                      error={birthdateError}
                      disabled={isSubmitting}
                      maximumDate={new Date()}
                      sheetTitle="Choose your birthdate"
                      sheetSubtitle="Use the date picker instead of typing month, day, and year separately."
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="gender"
                  render={({ field: { onChange, value } }) => (
                    <SheetSelectField
                      label="I identify as"
                      placeholder="Choose a gender"
                      options={[...GENDER_OPTIONS]}
                      value={value}
                      onSelect={onChange}
                      disabled={isSubmitting}
                      error={errors.gender?.message}
                      sheetTitle="Choose a gender"
                      sheetSubtitle="Use the option that best fits how you identify."
                    />
                  )}
                />
              </>
            )}

            <Button
              label={step < STEPS - 1 ? 'Continue' : 'Create my account'}
              onPress={() => {
                void onSubmitStep();
              }}
              loading={isSubmitting}
              disabled={!canProceed || isSubmitting}
              style={styles.ctaButton}
            />
          </GlassView>

          {step === 0 && (
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textMuted }]}>Already have an account? </Text>
              <Pressable onPress={onNavigateLogin}>
                <Text style={[styles.footerLink, { color: theme.accent }]}>Sign in</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function SignupScreen({
  navigation,
}: RootStackScreenProps<'Signup'>) {
  const [step, setStep] = useState(0);
  const signup = useAuthStore((state) => state.signup);
  const {
    control,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    defaultValues: {
      birthdate: '',
      email: '',
      firstName: '',
      gender: '',
      password: '',
    },
    resolver: zodResolver(signupSchema),
  });
  const firstName = watch('firstName');
  const email = watch('email');
  const password = watch('password');
  const birthdate = watch('birthdate');
  const gender = watch('gender');

  const fieldsByStep: Array<Array<keyof SignupFormValues>> = [
    ['firstName'],
    ['email', 'password'],
    ['birthdate', 'gender'],
  ];

  const handleNext = async () => {
    const isValid = await trigger(fieldsByStep[step], { shouldFocus: true });
    if (!isValid) return;
    if (step < STEPS - 1) {
      setStep((current) => current + 1);
    } else {
      await handleSubmit(async (values) => {
        try {
          await signup({
            email: values.email.trim().toLowerCase(),
            password: values.password,
            firstName: values.firstName.trim(),
            birthdate: values.birthdate,
            gender: values.gender,
          });
        } catch (error) {
          Alert.alert("Couldn't create account", normalizeApiError(error).message);
        }
      })();
    }
  };

  const canProceed = useMemo(() => {
    if (step === 0) return !!firstName.trim();
    if (step === 1) return !!email.trim() && !!password.trim();
    if (step === 2) {
      return !!birthdate && !!gender.trim();
    }
    return false;
  }, [step, firstName, email, password, birthdate, gender]);

  return (
    <SignupScreenView
      canProceed={canProceed}
      control={control}
      errors={errors}
      isSubmitting={isSubmitting}
      onBack={() => (step > 0 ? setStep(step - 1) : navigation.goBack())}
      onNavigateLogin={() => navigation.goBack()}
      onSubmitStep={handleNext}
      step={step}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  brandStrip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  brandStripText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    marginBottom: spacing.xxl,
  },
  progressItem: {
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotLabel: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  stepHeader: {
    marginBottom: spacing.xxl,
  },
  stepNum: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: spacing.sm,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 24,
    maxWidth: 300,
  },
  formCard: {
    padding: spacing.xxl,
  },
  formKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: spacing.lg,
  },
  ctaButton: {
    marginTop: spacing.sm,
    width: '100%',
  },
  selectGroupLabel: {
    marginBottom: spacing.sm,
    marginLeft: 2,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  birthdateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  birthdateMonthField: {
    flex: 1.35,
    marginBottom: 0,
  },
  birthdateField: {
    flex: 1,
    marginBottom: 0,
  },
  birthdateTrigger: {
    minHeight: 56,
  },
  inlineErrorText: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    marginLeft: 2,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxxl,
  },
  footerText: {
    fontSize: typography.body,
  },
  footerLink: {
    fontSize: typography.body,
    fontWeight: '700',
  },
});
