import React from 'react';
import { AccessibilityInfo, StyleSheet, UIManager, View } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { GlassView } from '../GlassView';
import { glass, glassFallbacks } from '../../../theme/glass';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

describe('GlassView', () => {
  let viewManagerSpy: jest.SpyInstance;
  let reduceTransparencySpy: jest.SpyInstance;
  let eventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    viewManagerSpy = jest.spyOn(UIManager, 'getViewManagerConfig').mockReturnValue(null as never);
    reduceTransparencySpy = jest
      .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
      .mockResolvedValue(false);
    eventListenerSpy = jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({
      remove: jest.fn(),
    } as never);
  });

  afterEach(() => {
    viewManagerSpy.mockRestore();
    reduceTransparencySpy.mockRestore();
    eventListenerSpy.mockRestore();
  });

  it('renders the solid fallback surface when blur is unavailable', () => {
    const { getByTestId } = render(
      <GlassView testID="glass" tier="medium" borderRadius={18}>
        <View testID="glass-child" />
      </GlassView>,
    );

    expect(getByTestId('glass-child')).toBeTruthy();

    const surface = getByTestId('glass');
    const style = StyleSheet.flatten(surface.props.style);

    expect(style).toEqual(
      expect.objectContaining({
        backgroundColor: glass.medium.background,
        borderColor: glass.medium.border,
        borderRadius: 18,
        borderWidth: 1,
      }),
    );
  });

  it('switches to the accessibility fallback color when reduce transparency is enabled', async () => {
    (AccessibilityInfo.isReduceTransparencyEnabled as jest.Mock).mockResolvedValueOnce(true);

    const { getByTestId } = render(
      <GlassView testID="glass" tier="thin">
        <View />
      </GlassView>,
    );

    await waitFor(() => {
      const surface = getByTestId('glass');
      const style = StyleSheet.flatten(surface.props.style);

      expect(style).toEqual(
        expect.objectContaining({
          backgroundColor: glassFallbacks.thin,
        }),
      );
    });
  });
});
