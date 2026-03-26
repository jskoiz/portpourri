import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Chip } from '../primitives';

jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    primary: '#C4A882',
    textMuted: '#7A7068',
  }),
}));

describe('Chip', () => {
  it('fires presses and marks the chip as selected when active', () => {
    const onPress = jest.fn();

    const { getByRole, getByLabelText } = render(
      <Chip label="Running" active onPress={onPress} />,
    );

    expect(getByLabelText('Running')).toBeTruthy();
    expect(getByRole('button').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );

    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders as non-interactive text when interactive is false', () => {
    const { getByLabelText, queryByRole } = render(
      <Chip label="Yoga" interactive={false} />,
    );

    expect(getByLabelText('Yoga').props.accessibilityRole).toBe('text');
    expect(queryByRole('button')).toBeNull();
  });
});
