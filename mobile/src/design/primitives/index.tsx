import React, { PropsWithChildren, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  Pressable,
  type StyleProp,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import AppIcon from '../../components/ui/AppIcon';
import { useTheme } from '../../theme/useTheme';
import { radii, shadows, spacing, typography } from '../../theme/tokens';

const StackPrimitive = View as React.ComponentType<any>;
const InlinePrimitive = View as React.ComponentType<any>;
const TextPrimitive = Text as React.ComponentType<any>;

export function Screen({
  children,
  padding = 16,
}: PropsWithChildren<{ padding?: number }>) {
  return <StackPrimitive flex={1} style={{ padding }}>{children}</StackPrimitive>;
}

export const AppStack = StackPrimitive;
export const Inline = InlinePrimitive;
export const Surface = StackPrimitive;
export const AppText = TextPrimitive;

export type PrimitiveButtonVariant = 'primary' | 'secondary' | 'accent' | 'energy' | 'ghost' | 'danger';

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
          backgroundColor: '#1A1A1A',
          ...shadows.soft,
        };
      case 'secondary':
        return {
          backgroundColor: theme.surfaceElevated,
          ...shadows.soft,
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
          backgroundColor: 'rgba(0,0,0,0.03)',
        };
      case 'danger':
        return {
          backgroundColor: theme.danger,
        };
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
        return theme.textPrimary;
    }
  };

  const sizeStyle: ViewStyle = size === 'sm'
    ? { minHeight: 38, paddingHorizontal: 16 }
    : {};

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={({ pressed }) => [{ opacity: isDisabled ? 0.48 : pressed ? 0.88 : 1 }]}
    >
      <Animated.View style={[primitiveStyles.buttonBase, getContainerStyle(), sizeStyle, { transform: [{ scale }] }, style]}>
        {loading ? (
          <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? theme.primary : theme.white} size="small" />
        ) : (
          <Text style={[primitiveStyles.buttonLabel, { color: getLabelColor() }]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

export type CardVariant = 'default' | 'elevated' | 'flat' | 'glass' | 'imageCard';

export function Card({
  accent,
  children,
  imageUri,
  style,
  testID,
  variant = 'default',
}: PropsWithChildren<{
  accent?: string;
  imageUri?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: CardVariant;
}>) {
  const theme = useTheme();
  const baseStyle: ViewStyle = {
    backgroundColor: variant === 'flat' ? 'transparent' : variant === 'glass' ? theme.surfaceGlass : theme.surface,
    ...(variant === 'elevated' ? shadows.medium : variant === 'flat' ? {} : shadows.soft),
  };

  if (variant === 'imageCard' && imageUri) {
    return (
      <ImageBackground testID={testID} source={{ uri: imageUri }} style={[primitiveStyles.card, primitiveStyles.imageCard, style]} imageStyle={{ borderRadius: 16 }}>
        <View style={primitiveStyles.imageOverlay}>{children}</View>
      </ImageBackground>
    );
  }

  return (
    <View testID={testID} style={[primitiveStyles.card, baseStyle, style]}>
      {accent ? <View style={[primitiveStyles.accentStrip, { backgroundColor: accent }]} /> : null}
      <View style={primitiveStyles.accentContent}>{children}</View>
    </View>
  );
}

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

  const handleFocus = (event: any) => {
    Animated.timing(focusAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    onFocus?.(event);
  };

  const handleBlur = (event: any) => {
    Animated.timing(focusAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    onBlur?.(event);
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? theme.danger : theme.border, error ? theme.danger : theme.primary],
  });

  return (
    <View style={primitiveStyles.inputWrapperOuter}>
      {label ? <Text style={[primitiveStyles.inputLabel, { color: theme.textMuted }]}>{label}</Text> : null}
      <Animated.View
        style={[
          primitiveStyles.inputWrapper,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor,
          },
        ]}
      >
        <TextInput
          {...props}
          placeholderTextColor={props.placeholderTextColor ?? theme.textMuted}
          selectionColor={props.selectionColor ?? theme.primary}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={handleFocus}
          onBlur={handleBlur}
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
  style?: ViewStyle;
  textStyle?: ViewStyle;
}) {
  const theme = useTheme();
  const color = accentColor ?? theme.primary;
  return (
    <Pressable
      onPress={interactive ? onPress : undefined}
      disabled={!interactive}
      style={[
        primitiveStyles.chip,
        active
          ? { backgroundColor: color + '14' }
          : { backgroundColor: 'rgba(0,0,0,0.04)' },
        style,
      ]}
    >
      <Text style={[primitiveStyles.chipText, { color: active ? color : theme.textMuted }, textStyle as any]}>{label}</Text>
    </Pressable>
  );
}

export function StatePanel({
  actionLabel,
  description,
  isError,
  loading,
  onAction,
  title,
}: {
  actionLabel?: string;
  description?: string;
  isError?: boolean;
  loading?: boolean;
  onAction?: () => void;
  title: string;
}) {
  const theme = useTheme();
  const icon = isError ? 'alert-circle' : 'compass';

  return (
    <View style={primitiveStyles.stateContainer}>
      <Card style={primitiveStyles.statePanel}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={primitiveStyles.loader} />
        ) : (
          <View
            style={[
              primitiveStyles.iconCircle,
              { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
            ]}
          >
            <AppIcon name={icon} size={24} color={isError ? theme.danger : theme.primary} />
          </View>
        )}
        <Text style={[primitiveStyles.stateTitle, { color: theme.textPrimary }]}>{title}</Text>
        {description ? <Text style={[primitiveStyles.stateDescription, { color: theme.textSecondary }]}>{description}</Text> : null}
        {actionLabel && onAction ? (
          <Button label={actionLabel} onPress={onAction} style={primitiveStyles.stateButton} variant={isError ? 'danger' : 'primary'} />
        ) : null}
      </Card>
    </View>
  );
}

const primitiveStyles = StyleSheet.create({
  buttonBase: {
    minHeight: 46,
    borderRadius: 999,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.25,
  },
  card: {
    borderRadius: 16,
    padding: spacing.lg,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentStrip: {
    width: 4,
    borderRadius: 2,
    marginRight: spacing.md,
    alignSelf: 'stretch',
  },
  accentContent: {
    flex: 1,
  },
  imageCard: {
    padding: 0,
    overflow: 'hidden',
  },
  imageOverlay: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    padding: spacing.lg,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  inputWrapperOuter: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    marginBottom: spacing.sm,
    marginLeft: 2,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    borderRadius: 14,
    borderWidth: 1,
  },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: typography.body,
    minHeight: 50,
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
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  chipText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  statePanel: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    ...shadows.soft,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  loader: {
    marginBottom: spacing.lg,
  },
  stateTitle: {
    fontSize: typography.h3,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  stateDescription: {
    fontSize: typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 24,
  },
  stateButton: {
    marginTop: spacing.xl,
    minWidth: 160,
  },
});
