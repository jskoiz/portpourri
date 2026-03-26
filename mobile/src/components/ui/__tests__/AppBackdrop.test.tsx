import React from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import AppBackdrop from '../AppBackdrop';

const mockLinearGradient = jest.fn();

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: (props: Record<string, unknown>) => {
    mockLinearGradient(props);
    return null;
  },
}));

describe('AppBackdrop', () => {
  beforeEach(() => {
    mockLinearGradient.mockClear();
  });

  it('renders a full-screen non-interactive backdrop with the expected gradient wash', () => {
    const { UNSAFE_getByType } = render(<AppBackdrop />);

    const backdrop = UNSAFE_getByType(View);

    expect(backdrop.props.pointerEvents).toBe('none');
    expect(backdrop.props.style).toEqual(
      expect.objectContaining({
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        overflow: 'hidden',
      }),
    );

    expect(mockLinearGradient).toHaveBeenCalledWith(
      expect.objectContaining({
        colors: ['rgba(184,169,196,0.03)', 'transparent'],
        start: { x: 0.5, y: 0 },
        end: { x: 0.5, y: 0.6 },
      }),
    );
  });
});
