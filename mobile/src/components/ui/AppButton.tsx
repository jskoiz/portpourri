import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  style?: ViewStyle;
}

export default function AppButton({ label, onPress, disabled, loading, variant = 'primary', style }: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        variant === 'primary' && shadows.glow,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? colors.textPrimary : colors.black} />
      ) : (
        <Text style={[styles.label, (variant === 'secondary' || variant === 'ghost') && styles.altLabel]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: '#B2A5FF',
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  disabled: {
    opacity: 0.58,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },
  label: {
    color: colors.black,
    fontSize: typography.body,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  altLabel: {
    color: colors.textPrimary,
  },
});
