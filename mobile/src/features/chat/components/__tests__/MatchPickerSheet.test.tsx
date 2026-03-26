import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { Match } from '../../../../api/types';
import { renderWithProviders } from '../../../../lib/testing/renderWithProviders';
import { MatchPickerSheet } from '../MatchPickerSheet';

const mockList = jest.fn();

jest.mock('../../../../services/api', () => ({
  matchesApi: {
    list: (...args: unknown[]) => mockList(...args),
  },
}));

const mockRefObject = { current: null };
const controller = {
  onChangeIndex: jest.fn(),
  onDismiss: jest.fn(),
  onRequestClose: jest.fn(),
  refObject: mockRefObject,
  visible: true,
};

function makeMatch(overrides: Partial<Match> & { user?: Partial<Match['user']> } = {}): Match {
  return {
    id: overrides.id ?? 'match-1',
    createdAt: overrides.createdAt ?? '2026-03-20T08:00:00.000Z',
    user: {
      id: overrides.user?.id ?? 'user-1',
      firstName: overrides.user?.firstName ?? 'Lana',
      photoUrl: overrides.user?.photoUrl ?? null,
    },
    lastMessage: overrides.lastMessage ?? null,
  };
}

describe('MatchPickerSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders matches and selects one', async () => {
    const match = makeMatch({
      id: 'match-1',
      user: {
        id: 'user-1',
        firstName: 'Lana',
        photoUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      },
    });
    const onClose = jest.fn();
    const onSelectMatch = jest.fn();

    mockList.mockResolvedValueOnce({ data: [match] });

    renderWithProviders(
      <MatchPickerSheet
        controller={controller}
        onClose={onClose}
        onSelectMatch={onSelectMatch}
      />,
    );

    fireEvent.press(await screen.findByLabelText('Invite Lana'));

    expect(onClose).toHaveBeenCalled();
    expect(onSelectMatch).toHaveBeenCalledWith(match);
  });

  it('shows an empty state when there are no matches', async () => {
    mockList.mockResolvedValueOnce({ data: [] });

    renderWithProviders(
      <MatchPickerSheet
        controller={controller}
        onClose={jest.fn()}
        onSelectMatch={jest.fn()}
      />,
    );

    expect(
      await screen.findByText('No matches yet. Start swiping to find your workout partner!'),
    ).toBeTruthy();
  });
});
