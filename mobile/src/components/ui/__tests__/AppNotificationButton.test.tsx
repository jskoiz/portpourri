import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import AppNotificationButton from '../AppNotificationButton';

jest.mock('../../../theme/useTheme', () => ({
  useTheme: () => ({
    textPrimary: '#2C2420',
    accent: '#E44B66',
  }),
}));

jest.mock('../AppIcon', () => {
  const { Text } = require('react-native');
  return ({ name }: { name: string }) => <Text testID={`app-icon-${name}`} />;
});

describe('AppNotificationButton', () => {
  it('announces unread notifications and caps the badge label at 99+', () => {
    const onPress = jest.fn();

    render(<AppNotificationButton unreadCount={120} onPress={onPress} />);

    expect(screen.getByLabelText('99+ unread notifications')).toBeTruthy();
    expect(screen.getByText('99+')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('99+ unread notifications'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('falls back to the neutral label when there are no unread notifications', () => {
    render(<AppNotificationButton onPress={jest.fn()} unreadCount={0} />);

    expect(screen.getByLabelText('Notifications')).toBeTruthy();
    expect(screen.queryByText(/^\d+$/)).toBeNull();
  });
});
