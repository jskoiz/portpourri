import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ChatScreen from '../ChatScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockGetMessages = jest.fn();
const mockSendMessage = jest.fn();
const mockConnectStream = jest.fn();

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

jest.mock('../../services/api', () => ({
  matchesApi: {
    getMessages: (...args: unknown[]) => mockGetMessages(...args),
    sendMessage: (...args: unknown[]) => mockSendMessage(...args),
  },
}));

jest.mock('../../services/matchRealtime', () => ({
  connectMatchMessageStream: (...args: unknown[]) => mockConnectStream(...args),
}));

describe('ChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMessages.mockResolvedValue({ data: [] });
    mockSendMessage.mockResolvedValue({ data: {} });
    mockConnectStream.mockResolvedValue(() => undefined);
  });

  it('prefills the composer and sends via matchesApi', async () => {
    render(<ChatScreen />);

    const input = await screen.findByDisplayValue('Coffee after the run?');
    fireEvent(input, 'submitEditing');

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith(
        'match-1',
        'Coffee after the run?',
      );
    });
  });
});
