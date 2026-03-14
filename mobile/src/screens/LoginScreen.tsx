import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { normalizeApiError } from '../api/errors';
import AppButton from '../components/ui/AppButton';
import AppInput from '../components/ui/AppInput';
import AppBackdrop from '../components/ui/AppBackdrop';
import { useTheme } from '../theme/useTheme';
import { radii, spacing, typography } from '../theme/tokens';

export default function LoginScreen({ navigation }: any) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const login = useAuthStore((state) => state.login);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = 'Email is required.';
    if (!password.trim()) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (error) {
      setSubmitError(normalizeApiError(error).message);
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

          <View style={styles.hero}>
            <View style={[styles.wordmarkPill, { borderColor: theme.border, backgroundColor: theme.surfaceGlass }]}>
              <Text style={[styles.eyebrow, { color: theme.accent }]}>PRIVATE SOCIAL / MOVEMENT</Text>
            </View>
            <Text style={styles.wordmark}>BRDG</Text>
            <Text style={[styles.headline, { color: theme.textPrimary }]}>
              Meet people through the way they actually move.
            </Text>
            <Text style={[styles.tagline, { color: theme.textMuted }]}>
              Dating energy, training energy, and social momentum stay in one refined flow.
            </Text>
            <View style={styles.heroMetaRow}>
              <View style={[styles.heroMetaCard, { backgroundColor: theme.surfaceGlass, borderColor: theme.border }]}>
                <Text style={styles.heroMetaLabel}>Curation</Text>
                <Text style={[styles.heroMetaValue, { color: theme.textPrimary }]}>Intent-aware discovery</Text>
              </View>
              <View style={[styles.heroMetaCard, { backgroundColor: theme.surfaceGlass, borderColor: theme.border }]}>
                <Text style={styles.heroMetaLabel}>Pace</Text>
                <Text style={[styles.heroMetaValue, { color: theme.textPrimary }]}>Quieter, more selective</Text>
              </View>
            </View>
          </View>

          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.formEyebrow, { color: theme.textMuted }]}>SIGN IN</Text>
            <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Welcome back.</Text>
            <AppInput
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={(v) => { setEmail(v); if (errors.email) setErrors((p) => ({ ...p, email: '' })); }}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!submitting}
              error={errors.email}
            />
            <AppInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={(v) => { setPassword(v); if (errors.password) setErrors((p) => ({ ...p, password: '' })); }}
              secureTextEntry
              editable={!submitting}
              error={errors.password}
            />

            {submitError ? (
              <View style={[styles.errorBanner, { backgroundColor: theme.dangerSubtle, borderColor: theme.danger }]}>
                <Text style={[styles.errorBannerText, { color: theme.danger }]}>{submitError}</Text>
              </View>
            ) : null}

            <AppButton
              label="Sign in"
              onPress={handleLogin}
              loading={submitting}
              style={styles.ctaButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textMuted }]}>Don't have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Signup')} disabled={submitting}>
              <Text style={[styles.footerLink, { color: theme.accent }]}>Join BRDG</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    marginBottom: spacing.xxxl,
  },
  wordmarkPill: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  wordmark: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 44,
    marginBottom: spacing.sm,
    color: '#7C6AF7',
  },
  headline: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 40,
    marginBottom: spacing.md,
  },
  tagline: {
    fontSize: typography.body,
    lineHeight: 24,
    letterSpacing: 0.2,
    maxWidth: 320,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  heroMetaCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.lg,
    minHeight: 86,
  },
  heroMetaLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  heroMetaValue: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    lineHeight: 20,
  },
  formCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: spacing.xxl,
    shadowColor: '#000',
    shadowOpacity: 0.30,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  formEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: spacing.sm,
  },
  formTitle: {
    fontSize: typography.h2,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: spacing.xl,
  },
  ctaButton: {
    marginTop: spacing.sm,
    width: '100%',
  },
  errorBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxxxl,
  },
  footerText: {
    fontSize: typography.body,
  },
  footerLink: {
    fontSize: typography.body,
    fontWeight: '700',
  },
});
