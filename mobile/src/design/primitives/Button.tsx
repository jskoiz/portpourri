import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AccessibilityInfo,
  Pressable,
  type StyleProp,
  Text,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { shadows } from '../../theme/tokens';
import { GlassView } from './GlassView';
import { primitiveStyles } from './primitiveStyles';

export type PrimitiveButtonVariant = 'primary' | 'secondary' | 'accent' | 'energy' | 'ghost' | 'danger' | 'glass' | 'glassProminent';

export function Button({
  disabled,
  label,
  loading,
  onPress,
  size = 'default',
  style,
  testID,
  variant = 'primary',
}: {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
  size?: 'default' | 'sm';
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: PrimitiveButtonVariant;
}) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const isDisabled = disabled || loading;
  const isGlass = variant === 'glass' || variant === 'glassProminent';

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduceMotionEnabled(enabled);
        }
      })
      .catch(() => {
        if (mounted) {
          setReduceMotionEnabled(false);
        }
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduceMotionEnabled(enabled);
    });

    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  const handlePressIn = () => {
    if (reduceMotionEnabled) {
      return;
    }
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    if (reduceMotionEnabled) {
      return;
    }
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.buttonPrimary,
          ...shadows.soft,
        };
      case 'secondary':
        return {
          backgroundColor: theme.surfaceElevated,
          borderWidth: 1,
          borderColor: theme.border,
        };
      case 'accent':
        return {
          backgroundColor: theme.accent,
          ...shadows.soft,
        };
      case 'energy':
        return {
          backgroundColor: theme.energy,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          backgroundColor: theme.danger,
        };
      case 'glass':
      case 'glassProminent':
        // Glass variants use GlassView wrapper — no background here
        return {};
    }
  };

  const getLabelColor = () => {
    switch (variant) {
      case 'primary':
      case 'accent':
      case 'energy':
      case 'danger':
        return theme.white;
      case 'secondary':
      case 'ghost':
      case 'glass':
      case 'glassProminent':
        return theme.textPrimary;
    }
  };

  const sizeStyle: ViewStyle = size === 'sm'
    ? { minHeight: 44, paddingHorizontal: 16 }
    : {};

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator color={isGlass || variant === 'secondary' || variant === 'ghost' ? theme.primary : theme.white} size="small" />
      ) : (
        <Text style={[primitiveStyles.buttonLabel, { color: getLabelColor() }]}>{label}</Text>
      )}
    </>
  );

  if (isGlass) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled ?? false, busy: loading ?? false }}
        style={({ pressed }) => [{ opacity: isDisabled ? 0.48 : pressed ? 0.85 : 1 }]}
      >
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
          <GlassView
            tier={variant === 'glassProminent' ? 'medium' : 'light'}
            tint={variant === 'glassProminent' ? theme.primarySubtle : undefined}
            borderRadius={999}
            specularHighlight
            style={[primitiveStyles.buttonBase, sizeStyle]}
          >
            {buttonContent}
          </GlassView>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled ?? false, busy: loading ?? false }}
      style={({ pressed }) => [{ opacity: isDisabled ? 0.48 : pressed ? 0.88 : 1 }]}
    >
      <Animated.View style={[primitiveStyles.buttonBase, getContainerStyle(), sizeStyle, { transform: [{ scale }] }, style]}>
        {buttonContent}
      </Animated.View>
    </Pressable>
  );
}
