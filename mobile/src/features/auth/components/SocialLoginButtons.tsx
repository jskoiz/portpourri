import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Button } from '../../../design/primitives';
import { useTheme } from '../../../theme/useTheme';
import { spacing, typography } from '../../../theme/tokens';

interface SocialLoginButtonsProps {
  onGooglePress: () => void;
  onApplePress: () => void;
  googleLoading: boolean;
  appleLoading: boolean;
  googleReady: boolean;
  disabled: boolean;
}

export function SocialLoginButtons({
  onGooglePress,
  onApplePress,
  googleLoading,
  appleLoading,
  googleReady,
  disabled,
}: SocialLoginButtonsProps) {
  const theme = useTheme();
  const showApple = Platform.OS === 'ios';

  return (
    <View style={styles.container}>
      {showApple && (
        <View
          style={[styles.appleButton, (appleLoading || disabled) && { opacity: 0.5 }]}
          pointerEvents={appleLoading || disabled ? 'none' : 'auto'}
        >
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={StyleSheet.absoluteFill}
            onPress={onApplePress}
          />
        </View>
      )}

      <Button
        testID="google-login-button"
        label="Continue with Google"
        onPress={onGooglePress}
        loading={googleLoading}
        disabled={disabled || !googleReady}
        variant="glass"
        style={styles.googleButton}
      />

      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        <Text style={[styles.dividerText, { color: theme.textMuted }]}>or</Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.md,
  },
  appleButton: {
    width: '100%',
    height: 48,
    marginBottom: spacing.sm,
  },
  googleButton: {
    width: '100%',
    marginBottom: spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
