import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportSheet } from '../ReportSheet';

const mockReport = jest.fn();

jest.mock('../../../../services/api', () => ({
  moderationApi: {
    report: (...args: unknown[]) => mockReport(...args),
  },
}));

// Mock bottom sheet components to render children directly
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BottomSheetModal: React.forwardRef(
      ({ children }: { children: React.ReactNode }, _ref: unknown) =>
        React.createElement(View, { testID: 'bottom-sheet-modal' }, children),
    ),
    BottomSheetScrollView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    BottomSheetView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    BottomSheetBackdrop: () => null,
  };
});

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

const mockRef = { current: null };
const defaultController = {
  onChangeIndex: jest.fn(),
  onDismiss: jest.fn(),
  onRequestClose: jest.fn(),
  refObject: mockRef,
  visible: true,
};

describe('ReportSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all report categories', () => {
    const { getByText } = render(
      <ReportSheet
        controller={defaultController}
        onClose={jest.fn()}
        reportedUserId="u1"
      />,
      { wrapper: createWrapper() },
    );

    expect(getByText('Harassment or bullying')).toBeTruthy();
    expect(getByText('Spam or scam')).toBeTruthy();
    expect(getByText('Fake profile')).toBeTruthy();
    expect(getByText('Inappropriate content')).toBeTruthy();
    expect(getByText('Other')).toBeTruthy();
  });

  it('renders submit button', () => {
    const { getByText } = render(
      <ReportSheet
        controller={defaultController}
        onClose={jest.fn()}
        reportedUserId="u1"
      />,
      { wrapper: createWrapper() },
    );

    expect(getByText('Submit report')).toBeTruthy();
  });

  it('submits report with selected category', async () => {
    mockReport.mockResolvedValue({ data: { id: 'r1', status: 'pending' } });
    const onClose = jest.fn();

    const { getByText } = render(
      <ReportSheet
        controller={defaultController}
        onClose={onClose}
        reportedUserId="u1"
        matchId="m1"
      />,
      { wrapper: createWrapper() },
    );

    fireEvent.press(getByText('Spam or scam'));
    fireEvent.press(getByText('Submit report'));

    await waitFor(() => {
      expect(mockReport).toHaveBeenCalledWith({
        reportedUserId: 'u1',
        matchId: 'm1',
        category: 'SPAM',
        description: undefined,
      });
    });
  });

  it('includes description when provided', async () => {
    mockReport.mockResolvedValue({ data: { id: 'r1', status: 'pending' } });

    const { getByText, getByPlaceholderText } = render(
      <ReportSheet
        controller={defaultController}
        onClose={jest.fn()}
        reportedUserId="u1"
      />,
      { wrapper: createWrapper() },
    );

    fireEvent.press(getByText('Harassment or bullying'));
    fireEvent.changeText(
      getByPlaceholderText('Additional details (optional)'),
      'This person was rude',
    );
    fireEvent.press(getByText('Submit report'));

    await waitFor(() => {
      expect(mockReport).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'HARASSMENT',
          description: 'This person was rude',
        }),
      );
    });
  });
});
