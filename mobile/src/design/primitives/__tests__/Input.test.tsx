import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Input } from '../Input';

jest.mock('../../../theme/useTheme', () => ({
  useTheme: () => ({
    primary: '#C4A882',
    surfaceGlass: '#FFFFFF',
    border: '#E8E2DA',
    danger: '#C0392B',
    textMuted: '#7A7068',
    textPrimary: '#2C2420',
  }),
}));

describe('Input', () => {
  it('marks invalid inputs and announces the error state', () => {
    render(
      <Input
        label="Email"
        placeholder="you@example.com"
        value=""
        onChangeText={jest.fn()}
        error="Email is required."
      />,
    );

    expect(screen.getByLabelText('Email').props.accessibilityState).toEqual({
      disabled: false,
      invalid: true,
    });
    expect(screen.getByText('Email is required.').props.accessibilityRole).toBe('alert');
  });
});
