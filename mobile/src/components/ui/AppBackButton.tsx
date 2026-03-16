import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

interface AppBackButtonProps {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function AppBackButton({ label, onPress, disabled, style }: AppBackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label ?? 'Back'}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.arrow}>←</Text>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  arrow: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 20,
    color: '#2C2420',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    color: '#7A7068',
  },
});
