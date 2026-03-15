import React from 'react';
import type { TextInputProps } from 'react-native';
import { Input } from '../../design/primitives';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export default function AppInput({ label, style, multiline, error, onFocus, onBlur, ...props }: AppInputProps) {
  return <Input label={label} style={style} multiline={multiline} error={error} onFocus={onFocus} onBlur={onBlur} {...props} />;
}
