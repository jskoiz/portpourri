import React, { useState } from 'react';
import { Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { normalizeApiError } from '../api/errors';
import AppButton from '../components/ui/AppButton';
import AppInput from '../components/ui/AppInput';
import AppCard from '../components/ui/AppCard';
import { colors, spacing, typography } from '../theme/tokens';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Enter both your email and password to continue.');
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (error) {
      Alert.alert('Couldn\'t log you in', normalizeApiError(error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>BRDG</Text>
          <Text style={styles.subtitle}>Meet active people who match your pace.</Text>

          <AppCard style={styles.formCard}>
            <AppInput
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!submitting}
            />
            <AppInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!submitting}
            />
            <AppButton label="Log in" onPress={handleLogin} loading={submitting} style={styles.submitButton} />
            <AppButton
              label="New here? Create account"
              variant="ghost"
              onPress={() => navigation.navigate('Signup')}
              disabled={submitting}
            />
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  title: {
    fontSize: typography.display,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },
  formCard: { width: '100%' },
  submitButton: { marginTop: spacing.sm, marginBottom: spacing.sm },
});
