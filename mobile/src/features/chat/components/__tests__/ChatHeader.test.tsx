import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ChatHeader } from '../ChatHeader';
import { lightTheme } from '../../../../theme/tokens';

jest.mock('../../../../theme/useTheme', () => ({
  useTheme: () => ({
    primary: '#C4A882',
    primarySubtle: '#F7F4F0',
    surface: '#FFFFFF',
    surfaceElevated: '#F7F4F0',
    border: '#E8E2DA',
    borderSoft: '#F0EBE4',
    textPrimary: '#2C2420',
    textSecondary: '#7A7068',
    textMuted: '#B0A89E',
    danger: '#C0392B',
    background: '#FDFBF8',
  }),
}));

describe('ChatHeader', () => {
  const baseProps = {
    activityTag: 'Morning run',
    onBack: jest.fn(),
    onOpenQuickActions: jest.fn(),
    theme: lightTheme,
    user: {
      id: 'user-1',
      firstName: 'Kai',
    } as never,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens the quick actions menu and calls the menu action', () => {
    const onReport = jest.fn();

    render(
      <ChatHeader
        {...baseProps}
        onReport={onReport}
      />,
    );

    fireEvent.press(screen.getByLabelText('More options'));
    fireEvent.press(screen.getByText('Quick actions'));

    expect(baseProps.onOpenQuickActions).toHaveBeenCalledTimes(1);
  });

  it('calls back when the back button is pressed', () => {
    render(<ChatHeader {...baseProps} />);

    fireEvent.press(screen.getByLabelText('Back'));

    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });
});
