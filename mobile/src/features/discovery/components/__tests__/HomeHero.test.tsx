import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { HomeHero } from '../HomeHero';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

const mockNotificationButton = jest.fn(({ onPress, unreadCount }: { onPress: () => void; unreadCount: number }) => (
  <Text accessibilityLabel={`Notifications ${unreadCount}`} onPress={onPress}>
    notifications
  </Text>
));

jest.mock('../../../../components/ui/AppNotificationButton', () => ({
  __esModule: true,
  default: (props: { onPress: () => void; unreadCount: number }) => mockNotificationButton(props),
}));

describe('HomeHero', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the greeting summary and forwards notification presses', () => {
    const onPressNotifications = jest.fn();

    const { getByLabelText, getByText } = render(
      <HomeHero
        feedCount={12}
        filterCount={3}
        greeting="Tonight, find your next workout"
        intentOption={{ color: '#C4A882', label: 'Training Partner' }}
        onPressNotifications={onPressNotifications}
        unreadCount={4}
      />,
    );

    expect(getByText('TONIGHT')).toBeTruthy();
    expect(getByText('Tonight, find your next workout')).toBeTruthy();
    expect(getByText('12 people · 3 filters')).toBeTruthy();
    expect(getByLabelText('Training Partner. 12 people · 3 filters')).toBeTruthy();

    fireEvent.press(getByLabelText('Notifications 4'));
    expect(onPressNotifications).toHaveBeenCalledTimes(1);
  });
});
