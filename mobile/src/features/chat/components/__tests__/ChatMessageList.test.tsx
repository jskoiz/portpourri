import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ChatMessageList } from '../ChatMessageList';
import { lightTheme } from '../../../../theme/tokens';

describe('ChatMessageList', () => {
  it('announces the message list and empty state', () => {
    render(
      <ChatMessageList
        messages={[]}
        onRefresh={jest.fn()}
        refreshing={false}
        theme={lightTheme}
      />,
    );

    expect(screen.getByLabelText('Conversation messages').props.accessibilityRole).toBe('list');
    expect(screen.getByText('No messages yet')).toBeTruthy();
  });
});
