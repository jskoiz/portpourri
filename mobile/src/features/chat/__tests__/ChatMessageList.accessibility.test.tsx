import React from 'react';
import { ChatMessageList } from '../components/ChatMessageList';
import type { Theme } from '../../../theme/tokens';
import { renderWithProviders } from '../../../lib/testing/renderWithProviders';

jest.mock('../components/EventInviteCard', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    EventInviteCard: ({ title }: { title: string }) => <Text>{title}</Text>,
  };
});

jest.mock('../../../services/api', () => ({
  eventsApi: {
    detail: jest.fn(),
    rsvp: jest.fn(),
  },
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueries: ({ queries }: { queries: Array<unknown> }) =>
    queries.map(() => ({ data: undefined })),
}));

jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  const React = require('react');
  const { Pressable, RefreshControl, StyleSheet, Text, View } = actual;

  return {
    FlatList: ({ data, renderItem }: any) => {
      return (
        <View>
          {data.map((item: any, index: number) => (
            <React.Fragment key={item.id}>{renderItem({ item, index })}</React.Fragment>
          ))}
        </View>
      );
    },
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
  };
});

jest.mock('../components/EventInviteCard', () => ({
  EventInviteCard: ({ title }: { title: string }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
}));

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('labels sent messages with "You:" prefix', () => {
    const { getByLabelText } = renderWithProviders(
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
    const { getByLabelText } = renderWithProviders(
      <ChatMessageList
        messages={[{ id: 'm2', text: 'Hey!', sender: 'them' }]}
        onRefresh={() => undefined}
        refreshing={false}
        theme={MOCK_THEME}
      />,
    );
    expect(getByLabelText('Them: Hey!')).toBeTruthy();
  });

it('preserves the invite note and renders the invite placeholder for event invite messages', () => {
    const rendered = renderWithProviders(
      <ChatMessageList
        messages={[
          {
            id: 'invite-1',
            text: 'Meet me there before the warm-up.\n[EVENT_INVITE:event-1]',
            sender: 'them',
          },
        ]}
        onNavigateToEvent={() => undefined}
        onRefresh={() => undefined}
        refreshing={false}
        theme={MOCK_THEME}
      />,
    );

expect(rendered.getByLabelText('Them: Meet me there before the warm-up.')).toBeTruthy();
    expect(rendered.getByText('Loading event...')).toBeTruthy();
  });
});
