import React, { PropsWithChildren, useRef } from 'react';
import {
  Animated,
  ImageBackground,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { radii, shadows } from '../../theme/tokens';
import { GlassView } from './GlassView';
import { primitiveStyles } from './primitiveStyles';

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
      <Pressable
        onPress={onPress}
        onPressIn={handleCardPressIn}
        onPressOut={handleCardPressOut}
        accessibilityRole="button"
      >
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
