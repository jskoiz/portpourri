import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

function buildBirthdate(year: string, month: string, day: string) {
  if (!year || !month || !day) {
    return '';
  }

  const birthdate = `${year}-${month}-${day}`;
  const parsed = new Date(`${birthdate}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().slice(0, 10) === birthdate ? birthdate : '';
}

export default function SignupScreen({ navigation }: any) {
  const theme = useTheme();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const signup = useAuthStore((state) => state.signup);
  const birthdate = buildBirthdate(birthYear, birthMonth, birthDay);

  const stepTitles = ["Let's start with you.", 'Secure your account.', 'One last thing.'];
  const stepSubtitles = [
    'Your name, so we can greet you right.',
    'Your email and a strong password.',
    'Your birthday and how you identify.',
  ];

  const validateStep = () => {
    const next: Record<string, string> = {};
    if (step === 0 && !firstName.trim()) next.firstName = 'First name is required.';
    if (step === 1) {
      if (!email.trim()) next.email = 'Email is required.';
      else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email.';
      if (!password.trim()) next.password = 'Password is required.';
      else if (password.trim().length < 8) next.password = 'Use at least 8 characters.';
    }
    if (step === 2) {
      if (!birthMonth || !birthDay || !birthYear) {
        next.birthdate = 'Choose your birth month, day, and year.';
      } else if (!birthdate) {
        next.birthdate = 'Choose a real birthdate.';
      }
      if (!gender.trim()) next.gender = 'Choose one of the listed gender options.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < STEPS - 1) {
      setStep(step + 1);
    } else {
      handleSignup();
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

  const handleSignup = async () => {
    setSubmitting(true);
    try {
      await signup({
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        birthdate,
        gender,
      });
    } catch (error) {
      Alert.alert("Couldn't create account", normalizeApiError(error).message);
    } finally {
      setSubmitting(false);
    }
  };

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
            disabled={submitting}
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
              <AppInput
                label="First name"
                placeholder="Alex"
                value={firstName}
                onChangeText={(v) => { setFirstName(v); if (errors.firstName) setErrors((p) => ({ ...p, firstName: '' })); }}
                editable={!submitting}
                error={errors.firstName}
                autoFocus
              />
            )}
            {step === 1 && (
              <>
                <AppInput
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={(v) => { setEmail(v); if (errors.email) setErrors((p) => ({ ...p, email: '' })); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!submitting}
                  error={errors.email}
                  autoFocus
                />
                <AppInput
                  label="Password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChangeText={(v) => { setPassword(v); if (errors.password) setErrors((p) => ({ ...p, password: '' })); }}
                  secureTextEntry
                  editable={!submitting}
                  error={errors.password}
                />
              </>
            )}
            {step === 2 && (
              <>
                <Text style={[styles.selectGroupLabel, { color: theme.textMuted }]}>Birthday</Text>
                <View style={styles.birthdateRow}>
                  <AppSelect
                    placeholder="Month"
                    options={MONTH_OPTIONS}
                    value={birthMonth}
                    onSelect={(value) => {
                      setBirthMonth(value);
                      if (errors.birthdate) setErrors((p) => ({ ...p, birthdate: '' }));
                    }}
                    disabled={submitting}
                    wrapperStyle={styles.birthdateMonthField}
                    triggerStyle={styles.birthdateTrigger}
                  />
                  <AppSelect
                    placeholder="Day"
                    options={DAY_OPTIONS}
                    value={birthDay}
                    onSelect={(value) => {
                      setBirthDay(value);
                      if (errors.birthdate) setErrors((p) => ({ ...p, birthdate: '' }));
                    }}
                    disabled={submitting}
                    wrapperStyle={styles.birthdateField}
                    triggerStyle={styles.birthdateTrigger}
                  />
                  <AppSelect
                    placeholder="Year"
                    options={YEAR_OPTIONS}
                    value={birthYear}
                    onSelect={(value) => {
                      setBirthYear(value);
                      if (errors.birthdate) setErrors((p) => ({ ...p, birthdate: '' }));
                    }}
                    disabled={submitting}
                    wrapperStyle={styles.birthdateField}
                    triggerStyle={styles.birthdateTrigger}
                  />
                </View>
                {errors.birthdate ? (
                  <Text style={[styles.inlineErrorText, { color: theme.danger }]}>
                    {errors.birthdate}
                  </Text>
                ) : null}
                <AppSelect
                  label="I identify as"
                  placeholder="Choose a gender"
                  options={[...GENDER_OPTIONS]}
                  value={gender}
                  onSelect={(value) => {
                    setGender(value);
                    if (errors.gender) setErrors((p) => ({ ...p, gender: '' }));
                  }}
                  disabled={submitting}
                  error={errors.gender}
                />
              </>
            )}

            <AppButton
              label={step < STEPS - 1 ? 'Continue' : 'Create my account'}
              onPress={handleNext}
              loading={submitting}
              disabled={!canProceed || submitting}
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
