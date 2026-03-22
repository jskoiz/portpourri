import React, { useRef } from 'react';
import {
  Animated,
  type NativeSyntheticEvent,
  StyleSheet,
  type TargetedEvent,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { primitiveStyles } from './primitiveStyles';

export function Input({
  error,
  label,
  multiline,
  onBlur,
  onFocus,
  style,
  ...props
}: TextInputProps & { error?: string; label?: string }) {
  const theme = useTheme();
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (event: NativeSyntheticEvent<TargetedEvent>) => {
    Animated.timing(focusAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    onFocus?.(event);
  };

  const handleBlur = (event: NativeSyntheticEvent<TargetedEvent>) => {
    Animated.timing(focusAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    onBlur?.(event);
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? theme.danger : theme.border, error ? theme.danger : theme.primary],
  });

  const glowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.12],
  });

  return (
    <View style={primitiveStyles.inputWrapperOuter}>
      {label ? <Text style={[primitiveStyles.inputLabel, { color: theme.textMuted }]}>{label}</Text> : null}
      <Animated.View
        style={[
          primitiveStyles.inputWrapper,
          {
            backgroundColor: theme.surfaceGlass,
            borderColor,
          },
        ]}
      >
        {/* Focus glow effect */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            primitiveStyles.inputGlow,
            {
              borderColor: theme.primary,
              opacity: glowOpacity,
            },
          ]}
          pointerEvents="none"
        />
        <TextInput
          {...props}
          placeholderTextColor={props.placeholderTextColor ?? theme.textMuted}
          selectionColor={props.selectionColor ?? theme.primary}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={props.accessibilityLabel ?? label}
          style={[
            primitiveStyles.input,
            { color: theme.textPrimary },
            multiline ? primitiveStyles.multiline : null,
            style,
          ]}
        />
      </Animated.View>
      {error ? <Text style={[primitiveStyles.errorText, { color: theme.danger }]}>{error}</Text> : null}
    </View>
  );
}
