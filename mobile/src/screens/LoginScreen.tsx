import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/authStore';
import { normalizeApiError } from '../api/errors';
import AppBackdrop from '../components/ui/AppBackdrop';
import { Button, Input } from '../design/primitives';
import { useTheme } from '../theme/useTheme';
import { radii, spacing, typography } from '../theme/tokens';
import { loginSchema, type LoginFormValues } from '../features/auth/schema';
import type { RootStackScreenProps } from '../core/navigation/types';

export default function LoginScreen({
  navigation,
}: RootStackScreenProps<'Login'>) {
  const theme = useTheme();
  const [submitError, setSubmitError] = useState('');
  const login = useAuthStore((state) => state.login);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  });

  const handleLogin = handleSubmit(async (values) => {
    setSubmitError('');
    try {
      await login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
    } catch (error) {
      setSubmitError(normalizeApiError(error).message);
    }
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
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
            <Controller
              control={control}
              name="email"
              render={({ field: { onBlur, onChange, value } }) => (
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={(nextValue) => {
                    setSubmitError('');
                    onChange(nextValue);
                  }}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  editable={!isSubmitting}
                  error={errors.email?.message}
                  returnKeyType="next"
                  submitBehavior="submit"
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onBlur, onChange, value } }) => (
                <Input
                  label="Password"
                  placeholder="••••••••"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={(nextValue) => {
                    setSubmitError('');
                    onChange(nextValue);
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
                  editable={!isSubmitting}
                  error={errors.password?.message}
                  returnKeyType="done"
                  submitBehavior="submit"
                  onSubmitEditing={handleLogin}
                />
              )}
            />

            {submitError ? (
              <View style={[styles.errorBanner, { backgroundColor: theme.dangerSubtle, borderColor: theme.danger }]}>
                <Text style={[styles.errorBannerText, { color: theme.danger }]}>{submitError}</Text>
              </View>
            ) : null}

            <Button
              label="Sign in"
              onPress={handleLogin}
              loading={isSubmitting}
              style={styles.ctaButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textMuted }]}>Don't have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Signup')} disabled={isSubmitting}>
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
    borderWidth: 0,
    padding: spacing.xxl,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
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
