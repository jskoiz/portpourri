import React from 'react';
import { render } from '@testing-library/react-native';
import AppIcon from '../AppIcon';

const mockFeather = jest.fn();

jest.mock('@expo/vector-icons', () => ({
  Feather: (props: Record<string, unknown>) => {
    mockFeather(props);
    const { Text } = require('react-native');
    return <Text testID="feather-icon" />;
  },
}));

jest.mock('../../../theme/useTheme', () => ({
  useTheme: () => ({
    textPrimary: '#2C2420',
  }),
}));

describe('AppIcon', () => {
  beforeEach(() => {
    mockFeather.mockClear();
  });

  it('hides itself from accessibility when no label is provided', () => {
    render(<AppIcon name="bell" />);

    expect(mockFeather).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'bell',
        color: '#2C2420',
        importantForAccessibility: 'no-hide-descendants',
      }),
    );
  });

  it('exposes accessibility metadata when a label is provided', () => {
    render(<AppIcon name="bell" accessibilityLabel="Notifications" color="#123456" />);

    expect(mockFeather).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'bell',
        color: '#123456',
        accessibilityLabel: 'Notifications',
        importantForAccessibility: 'yes',
      }),
    );
  });
});
