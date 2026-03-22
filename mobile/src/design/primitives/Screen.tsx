import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';

export function Screen({
  children,
  padding = 16,
}: PropsWithChildren<{ padding?: number }>) {
  return <View style={{ flex: 1, padding }}>{children}</View>;
}
