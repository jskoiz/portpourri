import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import React from 'react';
import { useReport } from '../useReport';

const mockReport = jest.fn();

jest.mock('../../../../services/api', () => ({
  moderationApi: {
    report: (...args: unknown[]) => mockReport(...args),
  },
}));

jest.spyOn(Alert, 'alert');

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

describe('useReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls moderationApi.report with the correct payload', async () => {
    mockReport.mockResolvedValue({ data: { id: 'r1', status: 'pending' } });

    const { result } = renderHook(() => useReport(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.report({
        reportedUserId: 'u1',
        category: 'HARASSMENT',
        description: 'Test report',
      });
    });

    expect(mockReport).toHaveBeenCalledWith({
      reportedUserId: 'u1',
      category: 'HARASSMENT',
      description: 'Test report',
    });
  });

  it('shows success alert on successful report', async () => {
    mockReport.mockResolvedValue({ data: { id: 'r1', status: 'pending' } });

    const { result } = renderHook(() => useReport(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.report({
        reportedUserId: 'u1',
        category: 'SPAM',
      });
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Report submitted',
      expect.any(String),
    );
  });

  it('calls onSuccess callback after successful report', async () => {
    mockReport.mockResolvedValue({ data: { id: 'r1', status: 'pending' } });
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useReport({ onSuccess }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.report({
        reportedUserId: 'u1',
        category: 'FAKE_PROFILE',
      });
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows error alert on failed report', async () => {
    mockReport.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useReport(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.report({
          reportedUserId: 'u1',
          category: 'OTHER',
        });
      } catch {
        // expected
      }
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Could not submit report',
      expect.any(String),
    );
  });

  it('tracks loading state', async () => {
    let resolveReport: (value: unknown) => void;
    mockReport.mockReturnValue(
      new Promise((resolve) => {
        resolveReport = resolve;
      }),
    );

    const { result } = renderHook(() => useReport(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);

    let reportPromise: Promise<unknown>;
    act(() => {
      reportPromise = result.current.report({
        reportedUserId: 'u1',
        category: 'HARASSMENT',
      });
    });

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      resolveReport!({ data: { id: 'r1', status: 'pending' } });
      await reportPromise;
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});
