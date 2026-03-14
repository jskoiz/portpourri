import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { normalizeApiError } from '../api/errors';
import AppButton from '../components/ui/AppButton';
import AppInput from '../components/ui/AppInput';
import AppBackButton from '../components/ui/AppBackButton';
import AppBackdrop from '../components/ui/AppBackdrop';
import { useTheme } from '../theme/useTheme';
import { radii, spacing, typography } from '../theme/tokens';

const STEPS = 3;
const STEP_LABELS = ['Account', 'Profile', 'Done'];

export default function SignupScreen({ navigation }: any) {
  const theme = useTheme();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [birthdate, setBirthdate] = useState('1995-01-01');
  const [gender, setGender] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const signup = useAuthStore((state) => state.signup);

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
      if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate.trim())) next.birthdate = 'Use YYYY-MM-DD format.';
      if (!gender.trim()) next.gender = 'How do you identify?';
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
    if (step === 2) return !!birthdate.trim() && !!gender.trim();
    return false;
  }, [step, firstName, email, password, birthdate, gender]);

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
                <AppInput
                  label="Birthday"
                  placeholder="YYYY-MM-DD"
                  value={birthdate}
                  onChangeText={(v) => { setBirthdate(v); if (errors.birthdate) setErrors((p) => ({ ...p, birthdate: '' })); }}
                  editable={!submitting}
                  error={errors.birthdate}
                  autoFocus
                />
                <AppInput
                  label="I identify as"
                  placeholder="e.g. woman, man, non-binary"
                  value={gender}
                  onChangeText={(v) => { setGender(v); if (errors.gender) setErrors((p) => ({ ...p, gender: '' })); }}
                  editable={!submitting}
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
