import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing, typography } from '../../theme/tokens';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export default function AppInput({ label, style, multiline, error, onFocus, onBlur, ...props }: AppInputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: any) => {
    setFocused(true);
    Animated.timing(focusAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    onFocus?.(e);
  };
  const handleBlur = (e: any) => {
    setFocused(false);
    Animated.timing(focusAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    onBlur?.(e);
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? theme.danger : theme.border, error ? theme.danger : theme.primary],
  });

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: theme.textMuted }]}>
          {label}
        </Text>
      ) : null}
      <Animated.View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor,
            shadowColor: focused ? theme.primary : '#000000',
            shadowOpacity: focused ? 0.14 : 0.05,
            shadowRadius: focused ? 18 : 8,
            shadowOffset: { width: 0, height: focused ? 6 : 2 },
            elevation: focused ? 4 : 2,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { color: theme.textPrimary },
            multiline && styles.multiline,
            style,
          ]}
          placeholderTextColor={theme.textMuted}
          selectionColor={theme.primary}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
      {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.sm,
    marginLeft: 2,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    borderRadius: 20,
    borderWidth: 1,
  },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 5,
    fontSize: typography.body,
    minHeight: 58,
  },
  multiline: {
    minHeight: 110,
    paddingTop: spacing.md,
  },
  errorText: {
    marginTop: spacing.xs,
    marginLeft: 2,
    fontSize: typography.caption,
    fontWeight: '600',
  },
});
