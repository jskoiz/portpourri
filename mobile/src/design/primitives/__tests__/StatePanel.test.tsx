import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StatePanel } from '../StatePanel';

jest.mock('../../../theme/useTheme', () => ({
  useTheme: () => ({
    primary: '#C4A882',
    surfaceElevated: '#F7F4F0',
    border: '#E8E2DA',
    danger: '#C0392B',
    textPrimary: '#2C2420',
    textSecondary: '#7A7068',
    textMuted: '#B0A89E',
    surfaceGlass: '#FFFFFF',
  }),
}));

describe('StatePanel', () => {
  it('announces loading and error states', () => {
    const { rerender } = render(<StatePanel title="Loading messages" loading />);

    expect(screen.getByLabelText('Loading messages')).toBeTruthy();
    expect(screen.getByLabelText('Loading: Loading messages').props.accessibilityRole).toBe('progressbar');

    rerender(
      <StatePanel
        title="Couldn't load messages"
        description="Try again."
        isError
      />,
    );

    expect(screen.UNSAFE_getByProps({ accessibilityRole: 'alert' }).props.accessibilityLabel).toBe(
      "Couldn't load messages. Try again.",
    );
  });
});
