import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import MatchesScreen from '../MatchesScreen';

const mockNavigate = jest.fn();
const mockRefetch = jest.fn();
const mockUseMatches = jest.fn();

jest.mock('@react-navigation/native', () => {
  const React = require('react');

  return {
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
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

describe('MatchesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetch.mockResolvedValue(undefined);
  });

  it('renders the loading state while matches are being fetched', () => {
    mockUseMatches.mockReturnValue({
      error: null,
      isLoading: true,
      isRefetching: false,
      matches: [],
      refetch: mockRefetch,
    });

    render(<MatchesScreen />);

    expect(screen.getByText('Loading conversations')).toBeTruthy();
  });

  it('renders the empty state and routes back to discovery', async () => {
    mockUseMatches.mockReturnValue({
      error: null,
      isLoading: false,
      isRefetching: false,
      matches: [],
      refetch: mockRefetch,
    });

    render(<MatchesScreen />);

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

    render(<MatchesScreen />);

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

    render(<MatchesScreen />);

    const thread = await screen.findByText('Want to lift tonight?');
    fireEvent.press(thread);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Chat', {
        matchId: 'match-1',
        user: match.user,
      });
    });
  });
});
