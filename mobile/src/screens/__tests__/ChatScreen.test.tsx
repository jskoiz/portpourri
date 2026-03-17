import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ChatScreen from '../ChatScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockRefresh = jest.fn();
const mockSendMessage = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {
      matchId: 'match-1',
      user: { firstName: 'Kai', fitnessProfile: { primaryGoal: 'endurance' } },
      prefillMessage: 'Coffee after the run?',
    },
  }),
}));

jest.mock('../../features/chat/hooks/useChatThread', () => ({
  useChatThread: () => ({
    connectionStatus: 'connected',
    error: null,
    loading: false,
    messages: [],
    refresh: mockRefresh,
    refreshing: false,
    sendMessage: mockSendMessage,
    sending: false,
  }),
}));

describe('ChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefresh.mockResolvedValue(undefined);
    mockSendMessage.mockResolvedValue(undefined);
  });

  it('prefills the composer and sends via matchesApi', async () => {
    render(<ChatScreen />);

    const input = await screen.findByDisplayValue('Coffee after the run?');
    fireEvent(input, 'submitEditing');

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Coffee after the run?');
    });
  });

  it('preserves the message in the input when send fails', async () => {
    mockSendMessage.mockRejectedValueOnce(new Error('Network error'));

    render(<ChatScreen />);

    const input = await screen.findByDisplayValue('Coffee after the run?');
    fireEvent(input, 'submitEditing');

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Coffee after the run?');
    });

    // Message should still be in the input so the user can retry
    expect(screen.getByDisplayValue('Coffee after the run?')).toBeTruthy();
  });
});
