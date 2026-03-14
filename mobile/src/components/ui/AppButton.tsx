import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing, typography } from '../../theme/tokens';

type Variant = 'primary' | 'secondary' | 'accent' | 'energy' | 'ghost' | 'danger';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  style?: ViewStyle;
  testID?: string;
}

export default function AppButton({ label, onPress, disabled, loading, variant = 'primary', style, testID }: AppButtonProps) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 2 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
  };

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.primary,
          borderColor: theme.primary,
          shadowColor: '#000000',
          shadowOpacity: 0.24,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 6,
        };
      case 'secondary':
        return {
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.borderSoft,
        };
      case 'accent':
        return {
          backgroundColor: theme.accent,
          borderColor: theme.accent,
          shadowColor: '#000000',
          shadowOpacity: 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 5,
        };
      case 'energy':
        return {
          backgroundColor: theme.energy,
          borderColor: theme.energy,
          shadowColor: '#000000',
          shadowOpacity: 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 5,
        };
      case 'ghost':
        return {
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderColor: theme.border,
        };
      case 'danger':
        return {
          backgroundColor: theme.danger,
          borderColor: theme.danger,
          shadowColor: theme.danger,
          shadowOpacity: 0.30,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 5,
        };
    }
  };

  const getLabelColor = () => {
    switch (variant) {
      case 'primary': return theme.white;
      case 'secondary': return theme.primary;
      case 'accent': return '#0D1117';
      case 'energy': return theme.textInverse;
      case 'ghost': return theme.textPrimary;
      case 'danger': return theme.white;
    }
  };

  const gradientColors = (() => {
    switch (variant) {
      case 'primary':
        return ['#9B8BFF', '#8A79FA', theme.primaryPressed] as const;
      case 'accent':
        return ['#61E8BF', '#47DBAA', '#23B887'] as const;
      case 'energy':
        return ['#F6BC4A', '#F0AA22', '#D68B02'] as const;
      default:
        return null;
    }
  })();

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={({ pressed }) => [{ opacity: isDisabled ? 0.48 : pressed ? 0.88 : 1 }]}
    >
      <Animated.View
        style={[
          styles.base,
          getContainerStyle(),
          { transform: [{ scale }] },
          style,
        ]}
      >
        {gradientColors ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientFill}
          >
            <View style={styles.innerHighlight} />
            {loading ? (
              <ActivityIndicator color={theme.white} size="small" />
            ) : (
              <Text style={[styles.label, { color: getLabelColor() }]}>{label}</Text>
            )}
          </LinearGradient>
        ) : (
          <>
            {loading ? (
              <ActivityIndicator
                color={variant === 'danger' ? theme.white : theme.primary}
                size="small"
              />
            ) : (
              <Text style={[styles.label, { color: getLabelColor() }]}>{label}</Text>
            )}
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: 20,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  gradientFill: {
    width: '100%',
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  innerHighlight: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    height: '52%',
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  label: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
    letterSpacing: 0.25,
  },
});
