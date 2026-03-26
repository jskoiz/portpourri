import { renderHook, waitFor } from '@testing-library/react-native';
import { createQueryTestHarness } from '../../../../lib/testing/queryTestHarness';
import { useMyEvents } from '../useMyEvents';

const mockMine = jest.fn();

jest.mock('../../../../services/api', () => ({
  eventsApi: {
    mine: (...args: unknown[]) => mockMine(...args),
  },
}));

describe('useMyEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns user events on success', async () => {
    const events = [{ id: 'e1', title: 'My Yoga' }];
    mockMine.mockResolvedValue({ data: events });

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useMyEvents(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.events).toEqual(events);
  });

  it('returns empty array on API failure', async () => {
    mockMine.mockRejectedValue(new Error('Network error'));

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useMyEvents(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.events).toEqual([]);
  });

  it('starts in loading state', () => {
    mockMine.mockReturnValue(new Promise(() => {}));

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useMyEvents(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.events).toEqual([]);
  });
});
