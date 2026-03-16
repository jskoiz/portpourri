import React, { PropsWithChildren, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  UIManager,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  glass,
  glassFallbacks,
  glassShadows,
  type GlassTier,
} from '../../theme/glass';

// Detect if expo-blur native module is available at runtime.
// In Expo Go or certain builds, the native view may not be registered.
let BlurViewComponent: React.ComponentType<any> | null = null;
try {
  const hasNativeModule =
    Platform.OS === 'ios' &&
    UIManager.getViewManagerConfig?.('ExpoBlurView') != null;
  if (hasNativeModule) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    BlurViewComponent = require('expo-blur').BlurView;
  }
} catch {
  // expo-blur not available — will use fallback
}

export type GlassViewProps = PropsWithChildren<{
  /** Glass intensity tier. Controls blur, background opacity, and border. */
  tier?: GlassTier;
  /** Optional tint color applied over the glass. */
  tint?: string;
  /** Override border radius (otherwise inherits from style or defaults to 22). */
  borderRadius?: number;
  /** Show subtle specular highlight along the top edge. */
  specularHighlight?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}>;

/**
 * Liquid Glass material primitive.
 *
 * Renders a translucent, blurred surface inspired by Apple's Liquid Glass.
 * Automatically falls back to a solid background when the user has enabled
 * Reduce Transparency, or on platforms where BlurView performs poorly.
 */
export function GlassView({
  borderRadius = 22,
  children,
  specularHighlight = false,
  style,
  testID,
  tier = 'medium',
  tint,
}: GlassViewProps) {
  const reduceTransparency = useReduceTransparency();
  const material = glass[tier];

  // Solid fallback for accessibility, Android, or when native blur module is unavailable
  if (reduceTransparency || Platform.OS === 'android' || !BlurViewComponent) {
    return (
      <View
        testID={testID}
        style={[
          styles.container,
          glassShadows.subtle,
          {
            backgroundColor: reduceTransparency
              ? glassFallbacks[tier]
              : material.background,
            borderRadius,
            borderWidth: 1,
            borderColor: material.border,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        glassShadows.standard,
        { borderRadius, overflow: 'hidden' },
        style,
      ]}
    >
      {BlurViewComponent ? (
        <BlurViewComponent
          intensity={material.blur}
          tint="light"
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {/* Background tint overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: tint ?? material.background,
          },
        ]}
      />

      {/* Edge border for definition */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius,
            borderWidth: 1,
            borderColor: material.border,
          },
        ]}
      />

      {/* Specular highlight — subtle top-edge light reflection */}
      {specularHighlight ? (
        <LinearGradient
          colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
          style={[styles.specular, { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }]}
        />
      ) : null}

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

/** Hook that tracks the system Reduce Transparency setting. */
function useReduceTransparency(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled?.()
      .then(setEnabled)
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setEnabled,
    );
    return () => sub.remove();
  }, []);

  return enabled;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    zIndex: 1,
  },
  content: {
    position: 'relative',
    zIndex: 2,
  },
});
