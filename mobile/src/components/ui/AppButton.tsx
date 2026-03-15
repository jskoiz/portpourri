import React from 'react';
import type { ViewStyle } from 'react-native';
import { Button, type PrimitiveButtonVariant } from '../../design/primitives';

type Variant = PrimitiveButtonVariant;

interface AppButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  style?: ViewStyle;
  testID?: string;
}

export default function AppButton({ label, onPress, disabled, loading, variant = 'primary', style, testID }: AppButtonProps) {
  return <Button label={label} onPress={onPress} disabled={disabled} loading={loading} variant={variant} style={style} testID={testID} />;
}
