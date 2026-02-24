import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

interface AppBackButtonProps {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function AppBackButton({ label = 'Back', onPress, disabled }: AppBackButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={styles.touch}>
      <Text style={[styles.text, disabled && styles.disabled]}>← {label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touch: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  text: {
    color: colors.primary,
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
});
