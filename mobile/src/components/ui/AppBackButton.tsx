import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { GlassView } from '../../design/primitives/GlassView';
import { triggerLightImpactHaptic } from '../../lib/interaction/feedback';
import { lightTheme } from '../../theme/tokens';

interface AppBackButtonProps {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function AppBackButton({ label, onPress, disabled, style }: AppBackButtonProps) {
  return (
    <Pressable
      onPress={() => {
        void triggerLightImpactHaptic();
        onPress();
      }}
      disabled={disabled}
      style={({ pressed }) => [
        {
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        },
        style,
      ]}
      testID="back-button"
      accessibilityRole="button"
      accessibilityLabel={label ?? 'Back'}
      accessibilityState={{ disabled: disabled ?? false }}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <GlassView tier="thin" borderRadius={20} style={styles.button}>
        <Text style={styles.arrow}>←</Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  arrow: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 20,
    color: lightTheme.textPrimary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    color: lightTheme.textMuted,
  },
});
