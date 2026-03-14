import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/authStore';
import { normalizeApiError } from '../api/errors';
import AppButton from '../components/ui/AppButton';
import AppInput from '../components/ui/AppInput';
import AppBackButton from '../components/ui/AppBackButton';
import AppBackdrop from '../components/ui/AppBackdrop';
import AppSelect from '../components/ui/AppSelect';
import { GENDER_OPTIONS } from '../constants/signup';
import { useTheme } from '../theme/useTheme';
import { radii, spacing, typography } from '../theme/tokens';
import {
  buildBirthdate,
  signupSchema,
  type SignupFormValues,
} from '../features/auth/schema';
import type { RootStackScreenProps } from '../core/navigation/types';

const STEPS = 3;
const STEP_LABELS = ['Account', 'Profile', 'Done'];
const MONTH_OPTIONS = [
  { label: 'January', value: '01' },
  { label: 'February', value: '02' },
  { label: 'March', value: '03' },
  { label: 'April', value: '04' },
  { label: 'May', value: '05' },
  { label: 'June', value: '06' },
  { label: 'July', value: '07' },
  { label: 'August', value: '08' },
  { label: 'September', value: '09' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];
const DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => ({
  label: `${index + 1}`,
  value: `${index + 1}`.padStart(2, '0'),
}));
const YEAR_OPTIONS = Array.from({ length: 101 }, (_, index) => {
  const year = `${new Date().getFullYear() - index}`;
  return { label: year, value: year };
});

export default function SignupScreen({
  navigation,
}: RootStackScreenProps<'Signup'>) {
  const theme = useTheme();
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
      birthDay: '',
      birthMonth: '',
      birthYear: '',
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
  const birthMonth = watch('birthMonth');
  const birthDay = watch('birthDay');
  const birthYear = watch('birthYear');
  const gender = watch('gender');

  const stepTitles = ["Let's start with you.", 'Secure your account.', 'One last thing.'];
  const stepSubtitles = [
    'Your name, so we can greet you right.',
    'Your email and a strong password.',
    'Your birthday and how you identify.',
  ];
  const fieldsByStep: Array<Array<keyof SignupFormValues>> = [
    ['firstName'],
    ['email', 'password'],
    ['birthMonth', 'birthDay', 'birthYear', 'gender', 'birthdate'],
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
            birthdate: buildBirthdate(values.birthYear, values.birthMonth, values.birthDay),
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
      return !!birthMonth && !!birthDay && !!birthYear && !!gender.trim();
    }
    return false;
  }, [step, firstName, email, password, birthMonth, birthDay, birthYear, gender]);
  const birthdateError = errors.birthdate?.message;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0D1117' }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppBackdrop />

          <AppBackButton
            onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()}
            disabled={isSubmitting}
          />

          <View style={[styles.brandStrip, { backgroundColor: theme.surfaceGlass, borderColor: theme.border }]}>
            <Text style={[styles.brandStripText, { color: theme.accent }]}>JOIN BRDG / SELECTIVE ENTRY</Text>
          </View>

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
            <Text style={[styles.title, { color: theme.textPrimary }]}>{stepTitles[step]}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{stepSubtitles[step]}</Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.formKicker, { color: theme.textMuted }]}>{STEP_LABELS[step].toUpperCase()}</Text>
            {step === 0 && (
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onBlur, onChange, value } }) => (
                  <AppInput
                    label="First name"
                    placeholder="Alex"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    editable={!isSubmitting}
                    error={errors.firstName?.message}
                    autoFocus
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
                    <AppInput
                      label="Email"
                      placeholder="you@example.com"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!isSubmitting}
                      error={errors.email?.message}
                      autoFocus
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <AppInput
                      label="Password"
                      placeholder="At least 8 characters"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      secureTextEntry
                      editable={!isSubmitting}
                      error={errors.password?.message}
                    />
                  )}
                />
              </>
            )}
            {step === 2 && (
              <>
                <Text style={[styles.selectGroupLabel, { color: theme.textMuted }]}>Birthday</Text>
                <View style={styles.birthdateRow}>
                  <Controller
                    control={control}
                    name="birthMonth"
                    render={({ field: { onChange, value } }) => (
                      <AppSelect
                        placeholder="Month"
                        options={MONTH_OPTIONS}
                        value={value}
                        onSelect={onChange}
                        disabled={isSubmitting}
                        wrapperStyle={styles.birthdateMonthField}
                        triggerStyle={styles.birthdateTrigger}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="birthDay"
                    render={({ field: { onChange, value } }) => (
                      <AppSelect
                        placeholder="Day"
                        options={DAY_OPTIONS}
                        value={value}
                        onSelect={onChange}
                        disabled={isSubmitting}
                        wrapperStyle={styles.birthdateField}
                        triggerStyle={styles.birthdateTrigger}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="birthYear"
                    render={({ field: { onChange, value } }) => (
                      <AppSelect
                        placeholder="Year"
                        options={YEAR_OPTIONS}
                        value={value}
                        onSelect={onChange}
                        disabled={isSubmitting}
                        wrapperStyle={styles.birthdateField}
                        triggerStyle={styles.birthdateTrigger}
                      />
                    )}
                  />
                </View>
                {birthdateError ? (
                  <Text style={[styles.inlineErrorText, { color: theme.danger }]}>
                    {birthdateError}
                  </Text>
                ) : null}
                <Controller
                  control={control}
                  name="gender"
                  render={({ field: { onChange, value } }) => (
                    <AppSelect
                      label="I identify as"
                      placeholder="Choose a gender"
                      options={[...GENDER_OPTIONS]}
                      value={value}
                      onSelect={onChange}
                      disabled={isSubmitting}
                      error={errors.gender?.message}
                    />
                  )}
                />
              </>
            )}

            <AppButton
              label={step < STEPS - 1 ? 'Continue' : 'Create my account'}
              onPress={() => {
                void handleNext();
              }}
              loading={isSubmitting}
              disabled={!canProceed || isSubmitting}
              style={styles.ctaButton}
            />
          </View>

          {step === 0 && (
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textMuted }]}>Already have an account? </Text>
              <Pressable onPress={() => navigation.goBack()}>
                <Text style={[styles.footerLink, { color: theme.accent }]}>Sign in</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    borderWidth: 1,
    borderRadius: radii.pill,
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
    borderRadius: 28,
    borderWidth: 1,
    padding: spacing.xxl,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
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
