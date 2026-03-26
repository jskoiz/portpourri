import { renderHook, waitFor } from '@testing-library/react-native';
import { createQueryTestHarness } from '../../../../lib/testing/queryTestHarness';
import { useExploreEvents } from '../useExploreEvents';

const mockList = jest.fn();

jest.mock('../../../../services/api', () => ({
  eventsApi: {
    list: (...args: unknown[]) => mockList(...args),
  },
}));

describe('useExploreEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns events on success', async () => {
    const events = [{ id: 'e1', title: 'Yoga' }];
    mockList.mockResolvedValue({ data: events });

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useExploreEvents(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.events).toEqual(events);
  });

  it('returns empty array on API failure', async () => {
    mockList.mockRejectedValue(new Error('Network error'));

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useExploreEvents(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.events).toEqual([]);
  });

  it('starts in loading state', () => {
    mockList.mockReturnValue(new Promise(() => {}));

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useExploreEvents(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.events).toEqual([]);
  });
});
