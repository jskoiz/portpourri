import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ChatScreen from '../ChatScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockRefresh = jest.fn();
const mockSendMessage = jest.fn();
let safeAreaViewProps: Record<string, unknown> | null = null;
let chatMessageListProps: Record<string, unknown> | null = null;

const mockNavigation = { navigate: mockNavigate, goBack: mockGoBack } as any;
const mockRoute = {
  key: 'Chat-1',
  name: 'Chat' as const,
  params: {
    matchId: 'match-1',
    user: { id: 'user-1', firstName: 'Kai', fitnessProfile: { primaryGoal: 'endurance' } },
    prefillMessage: 'Coffee after the run?',
  },
};

const mockChatThreadState = {
  connectionStatus: 'connected',
  error: null,
  isTyping: false,
  loading: false,
  messages: [],
  refresh: mockRefresh,
  refreshing: false,
  sendMessage: mockSendMessage,
  sending: false,
  emitTyping: jest.fn(),
};

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    safeAreaViewProps = props;
    return <View>{children}</View>;
  },
}));

jest.mock('../../features/chat/hooks/useChatThread', () => ({
  useChatThread: () => mockChatThreadState,
}));

jest.mock('../../features/chat/components/ChatMessageList', () => ({
  ChatMessageList: (props: Record<string, unknown>) => {
    chatMessageListProps = props;
    return null;
  },
}));

jest.mock('../../features/moderation/hooks/useBlock', () => ({
  useBlock: () => ({
    block: jest.fn(),
    isLoading: false,
  }),
}));

jest.mock('../../features/moderation/components/BlockConfirmation', () => ({
  showBlockConfirmation: jest.fn(),
}));

jest.mock('../../features/moderation/components/ReportSheet', () => ({
  ReportSheet: () => null,
}));

describe('ChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    safeAreaViewProps = null;
    chatMessageListProps = null;
    mockRefresh.mockResolvedValue(undefined);
    mockSendMessage.mockResolvedValue(undefined);
    Object.assign(mockChatThreadState, {
      connectionStatus: 'connected',
      error: null,
      isTyping: false,
      loading: false,
      messages: [],
      refresh: mockRefresh,
      refreshing: false,
      sendMessage: mockSendMessage,
      sending: false,
      emitTyping: jest.fn(),
    });
  });

  it('prefills the composer and sends via matchesApi', async () => {
    render(<ChatScreen navigation={mockNavigation} route={mockRoute as any} />);

    expect(screen.getByDisplayValue('Coffee after the run?')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Coffee after the run?');
    });
  });

  it('preserves the message in the input when send fails', async () => {
    mockSendMessage.mockRejectedValueOnce(new Error('Network error'));

    render(<ChatScreen navigation={mockNavigation} route={mockRoute as any} />);

    const input = await screen.findByDisplayValue('Coffee after the run?');
    fireEvent(input, 'submitEditing');

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Coffee after the run?');
    });

    // Message should still be in the input so the user can retry
    expect(screen.getByDisplayValue('Coffee after the run?')).toBeTruthy();
  });

  it('adds the bottom safe area inset for the composer', () => {
    render(<ChatScreen navigation={mockNavigation} route={mockRoute as any} />);

    expect(safeAreaViewProps?.edges).toEqual(['top', 'bottom']);
  });

  it('keeps pull-to-refresh idle during background polling refetches', () => {
    mockChatThreadState.refreshing = true;

    render(<ChatScreen navigation={mockNavigation} route={mockRoute as any} />);

    expect(chatMessageListProps?.refreshing).toBe(false);
  });

  it('passes event navigation through to the chat message list', () => {
    render(<ChatScreen navigation={mockNavigation} route={mockRoute as any} />);

    expect(chatMessageListProps?.onNavigateToEvent).toEqual(expect.any(Function));

    (chatMessageListProps?.onNavigateToEvent as (eventId: string) => void)('event-9');

    expect(mockNavigate).toHaveBeenCalledWith('EventDetail', { eventId: 'event-9' });
  });

  it('navigates to the user profile from the chat header', () => {
    render(<ChatScreen navigation={mockNavigation} route={mockRoute as any} />);

    fireEvent.press(screen.getByLabelText('Open profile for Kai'));

    expect(mockNavigate).toHaveBeenCalledWith('ProfileDetail', {
      user: mockRoute.params.user,
      userId: 'user-1',
    });
  });
});
