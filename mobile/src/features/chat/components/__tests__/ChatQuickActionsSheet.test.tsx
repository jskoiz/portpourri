import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ChatQuickActionsSheet } from '../ChatQuickActionsSheet';

jest.mock('../../../../design/sheets/AppBottomSheet', () => ({
  AppBottomSheet: ({
    children,
    subtitle,
    title,
  }: {
    children: React.ReactNode;
    subtitle: string;
    title: string;
  }) => {
    const { Text, View } = require('react-native');

    return (
      <View>
        <Text>{title}</Text>
        <Text>{subtitle}</Text>
        {children}
      </View>
    );
  },
  APP_BOTTOM_SHEET_SNAP_POINTS: {
    compact: ['40%'],
  },
}));

describe('ChatQuickActionsSheet', () => {
  const controller = {
    onChangeIndex: jest.fn(),
    onDismiss: jest.fn(),
    onRequestClose: jest.fn(),
    refObject: { current: null },
    visible: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the quick action copy deck', () => {
    render(
      <ChatQuickActionsSheet
        controller={controller}
        onClose={jest.fn()}
        onSelectMessage={jest.fn()}
      />,
    );

    expect(screen.getByText('Quick actions')).toBeTruthy();
    expect(screen.getByText('Suggested openers')).toBeTruthy();
    expect(screen.getByText('Suggest activity')).toBeTruthy();
    expect(screen.getByText('Plan workout')).toBeTruthy();
    expect(screen.getByText('Share event idea')).toBeTruthy();
  });

  it('closes the sheet and sends the selected canned message', () => {
    const onClose = jest.fn();
    const onSelectMessage = jest.fn();

    render(
      <ChatQuickActionsSheet
        controller={controller}
        onClose={onClose}
        onSelectMessage={onSelectMessage}
      />,
    );

    fireEvent.press(screen.getByLabelText('Use "Plan workout" message'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelectMessage).toHaveBeenCalledWith("I'm down to plan a workout. What day works for you?");
  });
});
