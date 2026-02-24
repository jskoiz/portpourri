import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export default function AppInput({ label, style, multiline, error, ...props }: AppInputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, multiline && styles.multiline, !!error && styles.inputError, style]}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
    fontSize: typography.bodySmall,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.body,
  },
  multiline: {
    minHeight: 110,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
    fontSize: typography.caption,
    fontWeight: '600',
  },
});
