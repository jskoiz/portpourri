import React, { PropsWithChildren, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  type NativeSyntheticEvent,
  Pressable,
  type TargetedEvent,
  type StyleProp,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import AppIcon from '../../components/ui/AppIcon';
import { useTheme } from '../../theme/useTheme';
import { radii, shadows, spacing, typography } from '../../theme/tokens';
import { GlassView } from './GlassView';

export { GlassView } from './GlassView';
export type { GlassViewProps } from './GlassView';

const StackPrimitive = View;
const InlinePrimitive = View;
const TextPrimitive = Text;

export function Screen({
  children,
  padding = 16,
}: PropsWithChildren<{ padding?: number }>) {
  return <StackPrimitive style={{ flex: 1, padding }}>{children}</StackPrimitive>;
}

export const AppStack = StackPrimitive;
export const Inline = InlinePrimitive;
export const Surface = StackPrimitive;
export const AppText = TextPrimitive;

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
  const isDisabled = disabled || loading;
  const isGlass = variant === 'glass' || variant === 'glassProminent';

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
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
          backgroundColor: theme.surfaceElevated,
          borderWidth: 1,
          borderColor: theme.border,
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
    ? { minHeight: 38, paddingHorizontal: 16 }
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
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled ?? false }}
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
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled ?? false }}
      style={({ pressed }) => [{ opacity: isDisabled ? 0.48 : pressed ? 0.88 : 1 }]}
    >
      <Animated.View style={[primitiveStyles.buttonBase, getContainerStyle(), sizeStyle, { transform: [{ scale }] }, style]}>
        {buttonContent}
      </Animated.View>
    </Pressable>
  );
}

export type CardVariant = 'default' | 'elevated' | 'flat' | 'glass' | 'imageCard';

export function Card({
  accent,
  children,
  imageUri,
  onPress,
  style,
  testID,
  variant = 'default',
}: PropsWithChildren<{
  accent?: string;
  imageUri?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: CardVariant;
}>) {
  const theme = useTheme();
  const cardScale = useRef(new Animated.Value(1)).current;

  const handleCardPressIn = () => {
    Animated.spring(cardScale, { toValue: 0.985, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };
  const handleCardPressOut = () => {
    Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };

  const wrapInteractive = (content: React.ReactElement) => {
    if (!onPress) return content;
    return (
      <Pressable onPress={onPress} onPressIn={handleCardPressIn} onPressOut={handleCardPressOut}>
        <Animated.View style={{ transform: [{ scale: cardScale }] }}>
          {content}
        </Animated.View>
      </Pressable>
    );
  };

  if (variant === 'imageCard' && imageUri) {
    return wrapInteractive(
      <ImageBackground testID={testID} source={{ uri: imageUri }} style={[primitiveStyles.card, primitiveStyles.imageCard, style]} imageStyle={{ borderRadius: radii.lg }}>
        <View style={primitiveStyles.imageOverlay}>{children}</View>
      </ImageBackground>
    );
  }

  // Glass variant uses GlassView for real blur
  if (variant === 'glass') {
    return wrapInteractive(
      <GlassView testID={testID} tier="light" borderRadius={radii.lg} style={[primitiveStyles.cardGlass, style]}>
        {accent ? <View style={[primitiveStyles.accentStrip, { backgroundColor: accent }]} /> : null}
        <View style={primitiveStyles.accentContent}>{children}</View>
      </GlassView>
    );
  }

  const baseStyle: ViewStyle = {
    backgroundColor: variant === 'flat' ? 'transparent' : theme.surface,
    ...(variant === 'elevated' ? shadows.medium : variant === 'flat' ? {} : shadows.soft),
  };

  return wrapInteractive(
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
            backgroundColor: 'rgba(255,255,255,0.6)',
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
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardGlass: {
    padding: spacing.lg,
    flexDirection: 'row',
  },
  accentStrip: {
    width: 3,
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
    borderRadius: radii.lg,
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
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputGlow: {
    borderRadius: radii.md,
    borderWidth: 2,
  },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: typography.body,
    minHeight: 48,
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
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.pill,
    minHeight: 44,
    justifyContent: 'center',
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
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  stateDescription: {
    fontSize: typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  stateButton: {
    marginTop: spacing.xl,
    minWidth: 160,
  },
});
