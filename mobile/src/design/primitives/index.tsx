import React, { PropsWithChildren, useRef, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
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
  style,
  testID,
  variant = 'primary',
}: {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
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
          backgroundColor: theme.primary,
          borderColor: theme.primary,
          ...shadows.medium,
        };
      case 'secondary':
        return {
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.borderSoft,
          ...shadows.soft,
        };
      case 'accent':
        return {
          backgroundColor: theme.accent,
          borderColor: theme.accent,
          ...shadows.soft,
        };
      case 'energy':
        return {
          backgroundColor: theme.energy,
          borderColor: theme.energy,
          ...shadows.soft,
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
          shadowOpacity: 0.3,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 5,
        };
    }
  };

  const getLabelColor = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return theme.white;
      case 'accent':
        return theme.textInverse;
      case 'energy':
        return theme.textInverse;
      case 'secondary':
        return theme.primary;
      case 'ghost':
        return theme.textPrimary;
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
      <Animated.View style={[primitiveStyles.buttonBase, getContainerStyle(), { transform: [{ scale }] }, style]}>
        {gradientColors ? (
          <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={primitiveStyles.gradientFill}>
            <View style={primitiveStyles.innerHighlight} />
            {loading ? <ActivityIndicator color={theme.white} size="small" /> : <Text style={[primitiveStyles.buttonLabel, { color: getLabelColor() }]}>{label}</Text>}
          </LinearGradient>
        ) : (
          <>
            {loading ? (
              <ActivityIndicator color={variant === 'danger' ? theme.white : theme.primary} size="small" />
            ) : (
              <Text style={[primitiveStyles.buttonLabel, { color: getLabelColor() }]}>{label}</Text>
            )}
          </>
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
    borderColor: variant === 'flat' ? 'transparent' : theme.border,
    borderWidth: variant === 'flat' ? 0 : 1,
    ...(variant === 'elevated' ? shadows.medium : variant === 'glass' ? shadows.soft : shadows.soft),
  };

  if (variant === 'imageCard' && imageUri) {
    return (
      <ImageBackground testID={testID} source={{ uri: imageUri }} style={[primitiveStyles.card, primitiveStyles.imageCard, style]} imageStyle={{ borderRadius: 20 }}>
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
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (event: any) => {
    setFocused(true);
    Animated.timing(focusAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    onFocus?.(event);
  };

  const handleBlur = (event: any) => {
    setFocused(false);
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
            shadowColor: focused ? theme.primary : '#000000',
            shadowOpacity: focused ? 0.14 : 0.05,
            shadowRadius: focused ? 18 : 8,
            shadowOffset: { width: 0, height: focused ? 6 : 2 },
            elevation: focused ? 4 : 2,
          },
        ]}
      >
        <TextInput
          value={props.value as string | undefined}
          onChangeText={props.onChangeText}
          placeholder={props.placeholder}
          autoCapitalize={props.autoCapitalize}
          keyboardType={props.keyboardType}
          editable={props.editable}
          autoFocus={props.autoFocus}
          secureTextEntry={props.secureTextEntry}
          returnKeyType={props.returnKeyType}
          placeholderTextColor={theme.textMuted}
          selectionColor={theme.primary}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          blurOnSubmit={props.blurOnSubmit}
          numberOfLines={props.numberOfLines}
          onSubmitEditing={props.onSubmitEditing}
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
          ? { backgroundColor: color + '22', borderColor: color + '70' }
          : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: theme.border },
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
  buttonLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
    letterSpacing: 0.25,
  },
  card: {
    borderRadius: 22,
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
    borderRadius: 20,
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
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
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
