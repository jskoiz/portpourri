import React, { useMemo, useState } from 'react';
import { Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { normalizeApiError } from '../api/errors';
import AppButton from '../components/ui/AppButton';
import AppInput from '../components/ui/AppInput';
import AppCard from '../components/ui/AppCard';
import AppBackButton from '../components/ui/AppBackButton';
import { colors, spacing, typography } from '../theme/tokens';

export default function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [birthdate, setBirthdate] = useState('1995-01-01');
  const [gender, setGender] = useState('male');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const signup = useAuthStore((state) => state.signup);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!firstName.trim()) nextErrors.firstName = 'First name is required.';
    if (!email.trim()) nextErrors.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!password.trim()) nextErrors.password = 'Password is required.';
    else if (password.trim().length < 8) nextErrors.password = 'Use at least 8 characters.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate.trim())) nextErrors.birthdate = 'Use YYYY-MM-DD format.';
    if (!gender.trim()) nextErrors.gender = 'Gender is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const canSubmit = useMemo(() => !!email.trim() && !!password.trim() && !!firstName.trim(), [email, password, firstName]);

  const handleSignup = async () => {
    if (!validate()) return;

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
      Alert.alert('Couldn\'t create account', normalizeApiError(error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <AppBackButton label="Back to login" onPress={() => navigation.goBack()} disabled={submitting} />

        <Text style={styles.title}>Create your BRDG profile</Text>
        <Text style={styles.subtitle}>A few details now, we\'ll tune your matches next.</Text>

        <AppCard>
          <AppInput label="First name" placeholder="Alex" value={firstName} onChangeText={(v) => { setFirstName(v); if (errors.firstName) setErrors((p) => ({ ...p, firstName: '' })); }} editable={!submitting} error={errors.firstName} />
          <AppInput label="Email" placeholder="you@example.com" value={email} onChangeText={(v) => { setEmail(v); if (errors.email) setErrors((p) => ({ ...p, email: '' })); }} autoCapitalize="none" keyboardType="email-address" editable={!submitting} error={errors.email} />
          <AppInput label="Password" placeholder="At least 8 characters" value={password} onChangeText={(v) => { setPassword(v); if (errors.password) setErrors((p) => ({ ...p, password: '' })); }} secureTextEntry editable={!submitting} error={errors.password} />
          <AppInput label="Birthdate (YYYY-MM-DD)" placeholder="1995-01-01" value={birthdate} onChangeText={(v) => { setBirthdate(v); if (errors.birthdate) setErrors((p) => ({ ...p, birthdate: '' })); }} editable={!submitting} error={errors.birthdate} />
          <AppInput label="Gender" placeholder="male / female / other" value={gender} onChangeText={(v) => { setGender(v); if (errors.gender) setErrors((p) => ({ ...p, gender: '' })); }} editable={!submitting} error={errors.gender} />

          <AppButton label="Continue" onPress={handleSignup} loading={submitting} disabled={!canSubmit || submitting} style={styles.submitButton} />
          <AppButton label="Already have an account? Log in" variant="ghost" onPress={() => navigation.goBack()} disabled={submitting} />
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing.xxxxl, justifyContent: 'center', minHeight: '100%' },
  title: {
    fontSize: typography.h1,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: { color: colors.textSecondary, fontSize: typography.body, marginBottom: spacing.xl },
  submitButton: { marginTop: spacing.sm, marginBottom: spacing.sm },
});
