import React from 'react';
import { act } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import MatchesScreen from '../MatchesScreen';

const mockNavigate = jest.fn();
const mockRefetch = jest.fn();
const mockUseMatches = jest.fn();

const mockNavigation = { navigate: mockNavigate } as any;

jest.mock('@react-navigation/native', () => {
  const React = require('react');

  return {
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => {
        const cleanup = callback();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, [callback]);
    },
  };
});

jest.mock('../../features/matches/hooks/useMatches', () => ({
  useMatches: (...args: unknown[]) => mockUseMatches(...args),
}));

jest.mock('../../components/ui/AppBackdrop', () => () => null);

jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    primary: '#C4A882',
    accent: '#C4A882',
    surface: '#FFFFFF',
    background: '#FDFBF8',
    textPrimary: '#2C2420',
    textSecondary: '#7A7068',
    textMuted: '#B0A89E',
    border: '#E8E2DA',
    borderSoft: '#F0EBE4',
    primarySubtle: '#F7F4F0',
    surfaceElevated: '#F7F4F0',
    danger: '#C0392B',
  }),
}));

describe('MatchesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetch.mockResolvedValue(undefined);
  });

  it('renders the loading state while matches are being fetched', () => {
    jest.useFakeTimers();
    mockUseMatches.mockReturnValue({
      error: null,
      isLoading: true,
      isRefetching: false,
      matches: [],
      refetch: mockRefetch,
    });

    render(<MatchesScreen navigation={mockNavigation} route={{ key: 'Inbox-1', name: 'Inbox' } as any} />);
    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByTestId('chat-list-skeleton')).toBeTruthy();
    jest.useRealTimers();
  });

  it('renders the empty state and routes back to discovery', async () => {
    mockUseMatches.mockReturnValue({
      error: null,
      isLoading: false,
      isRefetching: false,
      matches: [],
      refetch: mockRefetch,
    });

    render(<MatchesScreen navigation={mockNavigation} route={{ key: 'Inbox-1', name: 'Inbox' } as any} />);

    const goExplore = await screen.findByText('Go explore');
    fireEvent.press(goExplore);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Discover');
    });
  });

  it('renders the error state and retries the query', async () => {
    mockUseMatches.mockReturnValue({
      error: new Error('Inbox offline'),
      isLoading: false,
      isRefetching: false,
      matches: [],
      refetch: mockRefetch,
    });

    render(<MatchesScreen navigation={mockNavigation} route={{ key: 'Inbox-1', name: 'Inbox' } as any} />);

    expect(await screen.findByText("Couldn't load inbox")).toBeTruthy();

    fireEvent.press(screen.getByText('Try again'));

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalledTimes(2);
    });
  });

  it('opens the selected match thread', async () => {
    const match = {
      id: 'match-1',
      createdAt: '2026-03-16T10:00:00.000Z',
      lastMessage: 'Want to lift tonight?',
      user: {
        id: 'user-2',
        firstName: 'Kai',
        fitnessProfile: {
          primaryGoal: 'strength',
        },
      },
    };

    mockUseMatches.mockReturnValue({
      error: null,
      isLoading: false,
      isRefetching: false,
      matches: [match],
      refetch: mockRefetch,
    });

    render(<MatchesScreen navigation={mockNavigation} route={{ key: 'Inbox-1', name: 'Inbox' } as any} />);

    const card = await screen.findByText('Kai');
    fireEvent.press(card);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Chat', {
        matchId: 'match-1',
        user: match.user,
      });
    });
  });
});
