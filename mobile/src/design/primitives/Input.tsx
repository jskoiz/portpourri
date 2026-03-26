import React, { forwardRef, useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, type NativeSyntheticEvent, StyleSheet, type TargetedEvent, Text, TextInput, type TextInputProps, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { primitiveStyles } from './primitiveStyles';

type InputProps = TextInputProps & { error?: string; label?: string };

export const Input = forwardRef<TextInput, InputProps>(function Input({
  accessibilityHint,
  accessibilityState,
  error,
  label,
  multiline,
  onBlur,
  onFocus,
  style,
  ...props
}, ref) {
  const theme = useTheme();
  const focusAnim = useRef(new Animated.Value(0)).current;
  const resolvedAccessibilityLabel = props.accessibilityLabel ?? label;
  const resolvedAccessibilityState = {
    ...accessibilityState,
    disabled: accessibilityState?.disabled ?? props.editable === false,
    invalid: Boolean(error),
  } as unknown as TextInputProps['accessibilityState'];
  const resolvedAccessibilityHint = error
    ? `${accessibilityHint ? `${accessibilityHint}. ` : ''}${error}`
    : accessibilityHint;

  useEffect(() => {
    if (!error) {
      return;
    }
    void AccessibilityInfo.announceForAccessibility?.(error);
  }, [error]);

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
          ref={ref}
          {...props}
          placeholderTextColor={props.placeholderTextColor ?? theme.textMuted}
          selectionColor={props.selectionColor ?? theme.primary}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={resolvedAccessibilityLabel}
          accessibilityHint={resolvedAccessibilityHint}
          accessibilityState={resolvedAccessibilityState}
          style={[
            primitiveStyles.input,
            { color: theme.textPrimary },
            multiline ? primitiveStyles.multiline : null,
            style,
          ]}
        />
      </Animated.View>
      {error ? (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          style={[primitiveStyles.errorText, { color: theme.danger }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
});
