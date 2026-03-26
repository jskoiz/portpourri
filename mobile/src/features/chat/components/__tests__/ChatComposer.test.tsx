import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ChatComposer } from '../ChatComposer';
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

describe('ChatComposer', () => {
  const theme = {
    ...lightTheme,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps send disabled for blank drafts and sends trimmed text once populated', () => {
    const onChangeMessage = jest.fn();
    const onSend = jest.fn();

    render(
      <ChatComposer
        message="   "
        onChangeMessage={onChangeMessage}
        onSend={onSend}
        sending={false}
        theme={theme}
      />,
    );

    fireEvent.press(screen.getByLabelText('Send message'));
    expect(onSend).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText('Message input'), 'See you at the trail?');
    expect(onChangeMessage).toHaveBeenCalledWith('See you at the trail?');
  });

  it('submits the current draft when send is pressed', () => {
    const onChangeMessage = jest.fn();
    const onSend = jest.fn();

    render(
      <ChatComposer
        message="Coffee after the run?"
        onChangeMessage={onChangeMessage}
        onSend={onSend}
        sending={false}
        theme={theme}
      />,
    );

    fireEvent.press(screen.getByLabelText('Send message'));

    expect(onSend).toHaveBeenCalledTimes(1);
  });
});
