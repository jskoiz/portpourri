import React, { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radii, shadows, spacing } from '../../theme/tokens';

interface AppCardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
}

export default function AppCard({ children, style }: AppCardProps) {
  return (
    <View style={[styles.chrome, shadows.soft]}>
      <View style={[styles.card, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  chrome: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  card: {
    backgroundColor: colors.surfaceGlass,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
});
