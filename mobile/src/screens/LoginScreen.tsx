import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  useForm,
  type Control,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/authStore';
import { normalizeApiError } from '../api/errors';
import { ControlledInputField } from '../components/form/ControlledInputField';
import { Button, GlassView } from '../design/primitives';
import { AuthFooterLinkRow, AuthScreenShell } from '../features/auth/components/AuthScreenShell';
import { useTheme } from '../theme/useTheme';
import { lightTheme, radii, spacing, typography } from '../theme/tokens';
import { fontFamily } from '../lib/fonts';
// radii is used in JSX
import { loginSchema, type LoginFormValues } from '../features/auth/schema';
import type { RootStackScreenProps } from '../core/navigation/types';

export type LoginScreenViewProps = {
  control: Control<LoginFormValues>;
  isSubmitting: boolean;
  onClearSubmitError: () => void;
  onNavigateSignup: () => void;
  onSubmit: () => void;
  submitError: string;
};

export function LoginScreenView({
  control,
  isSubmitting,
  onClearSubmitError,
  onNavigateSignup,
  onSubmit,
  submitError,
}: LoginScreenViewProps) {
  const theme = useTheme();
  const hero = (
    <View style={styles.hero}>
      <GlassView tier="light" tint={theme.accentSubtle} borderRadius={999} style={styles.wordmarkPill}>
        <Text style={[styles.eyebrow, { color: theme.accent }]}>BRDG</Text>
      </GlassView>
      <Text style={styles.wordmark}>BRDG</Text>
      <Text style={[styles.headline, { color: theme.textPrimary }]} accessibilityRole="header">
        Connect through movement.
      </Text>
      <Text style={[styles.tagline, { color: theme.textMuted }]}>
        Find your people through shared activities.
      </Text>
      <View style={styles.heroMetaRow}>
        <GlassView tier="light" borderRadius={radii.lg} style={styles.heroMetaCard}>
          <Text style={styles.heroMetaLabel}>DISCOVERY</Text>
          <Text style={[styles.heroMetaValue, { color: theme.textPrimary }]}>Based on what you do</Text>
        </GlassView>
        <GlassView tier="light" borderRadius={radii.lg} style={styles.heroMetaCard}>
          <Text style={styles.heroMetaLabel}>PACE</Text>
          <Text style={[styles.heroMetaValue, { color: theme.textPrimary }]}>Quality over quantity</Text>
        </GlassView>
      </View>
    </View>
  );

  return (
    <AuthScreenShell
      hero={hero}
      card={(
        <GlassView tier="frosted" borderRadius={radii.xxl} specularHighlight style={styles.formCard}>
          <Text style={[styles.formEyebrow, { color: theme.textMuted }]}>SIGN IN</Text>
          <Text style={[styles.formTitle, { color: theme.textPrimary }]} accessibilityRole="header">Welcome back</Text>
          <ControlledInputField
            control={control}
            name="email"
            testID="login-email-input"
            label="Email"
            placeholder="you@example.com"
            onChangeTextTransform={(nextValue, onChange) => {
              onClearSubmitError();
              onChange(nextValue);
            }}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            disabled={isSubmitting}
            returnKeyType="next"
            submitBehavior="submit"
          />
          <ControlledInputField
            control={control}
            name="password"
            testID="login-password-input"
            label="Password"
            placeholder="••••••••"
            onChangeTextTransform={(nextValue, onChange) => {
              onClearSubmitError();
              onChange(nextValue);
            }}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            disabled={isSubmitting}
            returnKeyType="done"
            submitBehavior="submit"
            onSubmitEditing={onSubmit}
          />

          {submitError ? (
            <View
              style={[styles.errorBanner, { backgroundColor: theme.dangerSubtle, borderColor: theme.danger }]}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
              accessibilityLabel={submitError}
            >
              <Text style={[styles.errorBannerText, { color: theme.danger }]}>{submitError}</Text>
            </View>
          ) : null}

          <Button
            testID="login-submit-button"
            label="Sign in"
            onPress={onSubmit}
            loading={isSubmitting}
            style={styles.ctaButton}
          />
        </GlassView>
      )}
      footer={(
        <AuthFooterLinkRow
          prompt={"Don't have an account? "}
          linkLabel="Join BRDG"
          onPress={onNavigateSignup}
          disabled={isSubmitting}
          accessibilityLabel="Join BRDG"
          style={styles.footer}
        />
      )}
      contentContainerStyle={styles.content}
    />
  );
}

export default function LoginScreen({
  navigation,
}: RootStackScreenProps<'Login'>) {
  const [submitError, setSubmitError] = useState('');
  const login = useAuthStore((state) => state.login);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
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
    <LoginScreenView
      control={control}
      isSubmitting={isSubmitting}
      onClearSubmitError={() => setSubmitError('')}
      onNavigateSignup={() => navigation.navigate('Signup')}
      onSubmit={handleLogin}
      submitError={submitError}
    />
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
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 44,
    marginBottom: spacing.sm,
    color: lightTheme.textPrimary,
  },
  headline: {
    fontSize: 28,
    fontFamily: fontFamily.serifBold,
    letterSpacing: -0.5,
    lineHeight: 34,
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
    padding: spacing.lg,
    minHeight: 72,
  },
  heroMetaLabel: {
    color: '#8C8279',
    fontSize: 11,
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
    padding: spacing.xxl,
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
    marginTop: spacing.xxxxl,
  },
});
