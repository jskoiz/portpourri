import React from 'react';
import { render } from '@testing-library/react-native';
import { ChatMessageList } from '../components/ChatMessageList';
import type { Theme } from '../../../theme/tokens';

const MOCK_THEME: Theme = {
  primary: '#C4A882',
  accent: '#8BAA7A',
  background: '#FDFBF8',
  surface: '#FFFFFF',
  surfaceElevated: '#F7F4F0',
  textPrimary: '#2C2420',
  textSecondary: '#7A7068',
  textMuted: '#B0A89E',
  border: '#E8E2DA',
  borderSoft: '#F0EBE4',
  danger: '#CC4444',
  white: '#FFFFFF',
  energy: '#E8A838',
  primarySubtle: 'rgba(196,168,130,0.12)',
} as Theme;

describe('ChatMessageList accessibility', () => {
  it('labels sent messages with "You:" prefix', () => {
    const { getByLabelText } = render(
      <ChatMessageList
        messages={[{ id: 'm1', text: 'Hello there', sender: 'me' }]}
        onRefresh={() => undefined}
        refreshing={false}
        theme={MOCK_THEME}
      />,
    );
    expect(getByLabelText('You: Hello there')).toBeTruthy();
  });

  it('labels received messages with "Them:" prefix', () => {
    const { getByLabelText } = render(
      <ChatMessageList
        messages={[{ id: 'm2', text: 'Hey!', sender: 'them' }]}
        onRefresh={() => undefined}
        refreshing={false}
        theme={MOCK_THEME}
      />,
    );
    expect(getByLabelText('Them: Hey!')).toBeTruthy();
  });
});
