import React from 'react';
import {
  Pressable,
  type StyleProp,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { primitiveStyles } from './primitiveStyles';

export function Chip({
  accentColor,
  active = false,
  interactive = true,
  label,
  onPress,
  style,
  textStyle,
}: {
  accentColor?: string;
  active?: boolean;
  interactive?: boolean;
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const theme = useTheme();
  const color = accentColor ?? theme.primary;
  return (
    <Pressable
      onPress={interactive ? onPress : undefined}
      disabled={!interactive}
      accessibilityRole={interactive ? 'button' : 'text'}
      accessibilityState={interactive ? { selected: active } : undefined}
      accessibilityLabel={label}
      style={[
        primitiveStyles.chip,
        active
          ? { backgroundColor: color + '18' }
          : { backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
        style,
      ]}
    >
      <Text style={[primitiveStyles.chipText, { color: active ? color : theme.textMuted }, textStyle]}>{label}</Text>
    </Pressable>
  );
}
