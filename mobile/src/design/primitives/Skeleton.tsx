import React, { useEffect, useRef } from 'react';
import { Animated, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import { lightTheme, radii } from '../../theme/tokens';

// ─── Shimmer hook ────────────────────────────────────────────────────────────
function useShimmer(duration = 1200): Animated.AnimatedInterpolation<string> {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration,
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [duration, progress]);

  return progress.interpolate({
    inputRange: [0, 1],
    outputRange: [lightTheme.borderSoft, lightTheme.border],
  });
}

// ─── SkeletonBox ─────────────────────────────────────────────────────────────
export interface SkeletonBoxProps {
  /** Width — number (px) or percentage string (e.g. "100%"). Defaults to "100%". */
  width?: number | `${number}%`;
  /** Height in pixels. Defaults to 16. */
  height?: number;
  /** Border radius override. Defaults to `radii.sm`. */
  borderRadius?: number;
  /** Extra style. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = radii.sm,
  style,
  testID,
}: SkeletonBoxProps) {
  const bg = useShimmer();
  return (
    <Animated.View
      testID={testID}
      accessibilityLabel="Loading placeholder"
      style={[
        styles.box,
        { width, height, borderRadius, backgroundColor: bg },
        style,
      ]}
    />
  );
}

// ─── SkeletonCircle ──────────────────────────────────────────────────────────
export interface SkeletonCircleProps {
  /** Diameter in pixels. Defaults to 48. */
  size?: number;
  /** Extra style. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SkeletonCircle({ size = 48, style, testID }: SkeletonCircleProps) {
  const bg = useShimmer();
  return (
    <Animated.View
      testID={testID}
      accessibilityLabel="Loading placeholder"
      style={[
        styles.box,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        style,
      ]}
    />
  );
}

// ─── SkeletonTextLine — convenience for text-shaped placeholders ─────────────
export interface SkeletonTextLineProps {
  /** Width — number or percentage string. Defaults to "80%". */
  width?: number | `${number}%`;
  /** Extra style. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SkeletonTextLine({ width = '80%', style, testID }: SkeletonTextLineProps) {
  return <SkeletonBox width={width} height={12} borderRadius={6} style={style} testID={testID} />;
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
  },
});
