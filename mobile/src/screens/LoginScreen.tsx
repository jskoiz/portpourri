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
import { SocialLoginButtons } from '../features/auth/components/SocialLoginButtons';
import { useGoogleAuth } from '../features/auth/hooks/useGoogleAuth';
import { useAppleAuth } from '../features/auth/hooks/useAppleAuth';
import { useTheme } from '../theme/useTheme';
import { radii, spacing, typography } from '../theme/tokens';
import { fontFamily } from '../lib/fonts';
import { loginSchema, type LoginFormValues } from '../features/auth/schema';
import type { RootStackScreenProps } from '../core/navigation/types';

export type LoginScreenViewProps = {
  control: Control<LoginFormValues>;
  isSubmitting: boolean;
  onClearSubmitError: () => void;
  onNavigateSignup: () => void;
  onSubmit: () => void;
  submitError: string;
  onGoogleLogin: () => void;
  onAppleLogin: () => void;
  googleLoading: boolean;
  appleLoading: boolean;
  googleReady: boolean;
};

export function LoginScreenView({
  control,
  isSubmitting,
  onClearSubmitError,
  onNavigateSignup,
  onSubmit,
  submitError,
  onGoogleLogin,
  onAppleLogin,
  googleLoading,
  appleLoading,
  googleReady,
}: LoginScreenViewProps) {
  const theme = useTheme();

  return (
    <AuthScreenShell
      hero={(
        <View style={styles.hero}>
          <Text accessibilityRole="header" style={[styles.wordmark, { color: theme.textPrimary }]}>BRDG</Text>
          <Text style={[styles.tagline, { color: theme.textMuted }]}>
            Connect through movement
          </Text>
        </View>
      )}
      card={(
        <GlassView tier="frosted" borderRadius={radii.xxl} specularHighlight style={styles.formCard}>
          <SocialLoginButtons
            onGooglePress={onGoogleLogin}
            onApplePress={onAppleLogin}
            googleLoading={googleLoading}
            appleLoading={appleLoading}
            googleReady={googleReady}
            disabled={isSubmitting}
          />
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
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const loginWithApple = useAuthStore((s) => s.loginWithApple);
  const { signIn: googleSignIn, isLoading: googleLoading, isReady: googleReady } = useGoogleAuth();
  const { signIn: appleSignIn, isLoading: appleLoading } = useAppleAuth();
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

  const handleGoogleLogin = async () => {
    setSubmitError('');
    try {
      const idToken = await googleSignIn();
      if (idToken) await loginWithGoogle(idToken);
    } catch (error) {
      setSubmitError(normalizeApiError(error).message);
    }
  };

  const handleAppleLogin = async () => {
    setSubmitError('');
    try {
      const result = await appleSignIn();
      if (result) await loginWithApple(result.identityToken, result.fullName);
    } catch (error) {
      setSubmitError(normalizeApiError(error).message);
    }
  };

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
      onGoogleLogin={handleGoogleLogin}
      onAppleLogin={handleAppleLogin}
      googleLoading={googleLoading}
      appleLoading={appleLoading}
      googleReady={googleReady}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    marginBottom: spacing.xxl,
  },
  wordmark: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 44,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: typography.body,
    fontFamily: fontFamily.serifBold,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  formCard: {
    padding: spacing.xxl,
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
    marginTop: spacing.xxxl,
  },
});
