import React, { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Card, type CardVariant } from '../../design/primitives';

interface AppCardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
  /** Left accent strip color */
  accent?: string;
  /** Image URI for imageCard variant */
  imageUri?: string;
}

export default function AppCard({ children, style, variant = 'default', accent, imageUri }: AppCardProps) {
  return <Card variant={variant} accent={accent} imageUri={imageUri} style={style as ViewStyle}>{children}</Card>;
}
