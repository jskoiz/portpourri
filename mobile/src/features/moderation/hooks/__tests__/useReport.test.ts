import { renderHook, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { createQueryTestHarness } from '../../../../lib/testing/queryTestHarness';
import { useReport } from '../useReport';

const mockReport = jest.fn();

jest.mock('../../../../services/api', () => ({
  moderationApi: {
    report: (...args: unknown[]) => mockReport(...args),
  },
}));

jest.spyOn(Alert, 'alert');

describe('useReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls moderationApi.report with the correct payload', async () => {
    mockReport.mockResolvedValue({ data: { id: 'r1', status: 'pending' } });

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useReport(), { wrapper });

    await act(async () => {
      await result.current.report({
        reportedUserId: 'u1',
        category: 'HARASSMENT',
        description: 'Test report',
      });
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockReport).toHaveBeenCalledWith({
      reportedUserId: 'u1',
      category: 'HARASSMENT',
      description: 'Test report',
    });
  });

  it('shows success alert on successful report', async () => {
    mockReport.mockResolvedValue({ data: { id: 'r1', status: 'pending' } });

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useReport(), { wrapper });

    await act(async () => {
      await result.current.report({
        reportedUserId: 'u1',
        category: 'SPAM',
      });
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Report submitted',
      expect.any(String),
    );
  });

  it('calls onSuccess callback after successful report', async () => {
    mockReport.mockResolvedValue({ data: { id: 'r1', status: 'pending' } });
    const onSuccess = jest.fn();

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useReport({ onSuccess }), { wrapper });

    await act(async () => {
      await result.current.report({
        reportedUserId: 'u1',
        category: 'FAKE_PROFILE',
      });
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows error alert on failed report', async () => {
    mockReport.mockRejectedValue(new Error('Server error'));

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useReport(), { wrapper });

    await act(async () => {
      await expect(
        result.current.report({
          reportedUserId: 'u1',
          category: 'OTHER',
        }),
      ).resolves.toBeUndefined();
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Could not submit report',
      expect.any(String),
    );
  });

  it('tracks loading state', async () => {
    let resolveReport;
    mockReport.mockReturnValue(
      new Promise((resolve) => {
        resolveReport = resolve;
      }),
    );

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useReport(), { wrapper });

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
