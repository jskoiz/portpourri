import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface AppBackButtonProps {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function AppBackButton({ label, onPress, disabled, style }: AppBackButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label ?? 'Back'}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={[styles.arrow, { color: theme.textPrimary }]}>←</Text>
      {label ? <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});
