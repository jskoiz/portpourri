import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useProfileEditor } from '../useProfileEditor';

const mockTriggerErrorHaptic = jest.fn();
const mockTriggerSuccessHaptic = jest.fn();
const mockShowToast = jest.fn();

jest.mock('../../../../lib/interaction/feedback', () => ({
  triggerErrorHaptic: (...args: unknown[]) => mockTriggerErrorHaptic(...args),
  triggerSuccessHaptic: (...args: unknown[]) => mockTriggerSuccessHaptic(...args),
}));

jest.mock('../../../../store/toastStore', () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}));

function makeProfile() {
  return {
    id: 'user-1',
    profile: {
      bio: 'Old bio',
      city: 'Old City',
      intentDating: false,
      intentWorkout: false,
      intentFriends: false,
      latitude: 21.3,
      longitude: -157.8,
    },
    fitnessProfile: {
      intensityLevel: 'moderate',
      weeklyFrequencyBand: '3-4',
      primaryGoal: 'connection',
      favoriteActivities: 'Running',
      prefersMorning: false,
      prefersEvening: true,
    },
  };
}

type ProfileShape = ReturnType<typeof makeProfile>;

describe('useProfileEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('preserves unsaved fitness draft when basics save but fitness fails', async () => {
    const updateProfile = jest.fn().mockResolvedValue(undefined);
    const updateFitness = jest.fn().mockRejectedValue(new Error('Fitness save failed'));
    const profile = makeProfile();

    const { result, rerender } = renderHook<
      ReturnType<typeof useProfileEditor>,
      { currentProfile: ProfileShape }
    >(
      ({ currentProfile }) =>
        useProfileEditor({
          profile: currentProfile as never,
          updateProfile,
          updateFitness,
        }),
      {
        initialProps: {
          currentProfile: profile,
        },
      },
    );

    act(() => {
      void result.current.save();
    });

    await waitFor(() => {
      expect(result.current.editMode).toBe(true);
    });

    act(() => {
      result.current.setBio('Updated bio');
      result.current.setIntensityLevel('high');
      result.current.setWeeklyFrequencyBand('5+');
      result.current.setPrimaryGoal('strength');
      result.current.toggleActivity('Surfing');
      result.current.toggleSchedule('Morning');
    });

    await act(async () => {
      await result.current.save();
    });

    rerender({
      currentProfile: {
        ...profile,
        profile: {
          ...profile.profile,
          bio: 'Updated bio',
        },
      },
    });

    expect(updateProfile).toHaveBeenCalledWith({
      bio: 'Updated bio',
    });
    expect(updateFitness).toHaveBeenCalledWith({
      intensityLevel: 'high',
      weeklyFrequencyBand: '5+',
      primaryGoal: 'strength',
      favoriteActivities: 'Running, Surfing',
      prefersMorning: true,
    });
    expect(result.current.error).toBe(
      'Profile basics were saved, but fitness settings could not be saved. Please try again.',
    );
    expect(result.current.editMode).toBe(true);
    expect(result.current.intensityLevel).toBe('high');
    expect(result.current.weeklyFrequencyBand).toBe('5+');
    expect(result.current.primaryGoal).toBe('strength');
    expect(result.current.selectedActivities).toEqual(['Running', 'Surfing']);
    expect(result.current.selectedSchedule).toEqual(['Evening', 'Morning']);
    expect(mockTriggerErrorHaptic).toHaveBeenCalled();
    expect(mockTriggerSuccessHaptic).not.toHaveBeenCalled();
  });

  it('exits edit mode without mutating when nothing changed', async () => {
    const updateProfile = jest.fn().mockResolvedValue(undefined);
    const updateFitness = jest.fn().mockResolvedValue(undefined);
    const profile = makeProfile();

    const { result } = renderHook(() =>
      useProfileEditor({
        profile: profile as never,
        updateProfile,
        updateFitness,
      }),
    );

    act(() => {
      void result.current.save();
    });

    await waitFor(() => {
      expect(result.current.editMode).toBe(true);
    });

    await act(async () => {
      await result.current.save();
    });

    expect(updateProfile).not.toHaveBeenCalled();
    expect(updateFitness).not.toHaveBeenCalled();
    expect(result.current.editMode).toBe(false);
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('keeps the local draft when profile data changes mid-edit', async () => {
    const updateProfile = jest.fn().mockResolvedValue(undefined);
    const updateFitness = jest.fn().mockResolvedValue(undefined);
    const profile = makeProfile();

    const { result, rerender } = renderHook<
      ReturnType<typeof useProfileEditor>,
      { currentProfile: ProfileShape }
    >(
      ({ currentProfile }) =>
        useProfileEditor({
          profile: currentProfile as never,
          updateProfile,
          updateFitness,
        }),
      {
        initialProps: {
          currentProfile: profile,
        },
      },
    );

    act(() => {
      void result.current.save();
    });

    await waitFor(() => {
      expect(result.current.editMode).toBe(true);
    });

    act(() => {
      result.current.setBio('Draft bio');
    });

    rerender({
      currentProfile: {
        ...profile,
        profile: {
          ...profile.profile,
          bio: 'Remote bio',
        },
      },
    });

    expect(result.current.bio).toBe('Draft bio');
  });

  it('treats refresh failure after save as a warning toast instead of an error state', async () => {
    const updateProfile = jest.fn().mockResolvedValue(undefined);
    const updateFitness = jest.fn().mockResolvedValue(undefined);
    const profile = makeProfile();

    const { result } = renderHook(() =>
      useProfileEditor({
        profile: profile as never,
        updateProfile,
        updateFitness,
      }),
    );

    act(() => {
      void result.current.save();
    });

    await waitFor(() => {
      expect(result.current.editMode).toBe(true);
    });

    act(() => {
      result.current.setBio('Updated bio');
    });

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.editMode).toBe(false);
    expect(mockTriggerSuccessHaptic).toHaveBeenCalled();
    expect(mockTriggerErrorHaptic).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith(
      'Changes saved',
      'success',
    );
    expect(mockShowToast).toHaveBeenCalledWith(
      'Profile saved, but we could not refresh the latest copy. Pull to refresh if anything looks stale.',
      'warning',
    );
  });

  it('clears saved coordinates when the user replaces a selected city with freeform text', async () => {
    const updateProfile = jest.fn().mockResolvedValue(undefined);
    const updateFitness = jest.fn().mockResolvedValue(undefined);
    const profile = makeProfile();

    const { result } = renderHook(() =>
      useProfileEditor({
        profile: profile as never,
        updateProfile,
        updateFitness,
      }),
    );

    act(() => {
      void result.current.save();
    });

    await waitFor(() => {
      expect(result.current.editMode).toBe(true);
    });

    act(() => {
      result.current.selectCitySuggestion({
        value: 'Kailua',
        latitude: 21.4,
        longitude: -157.7,
      } as never);
      result.current.updateCity('Kailua Town');
    });

    await act(async () => {
      await result.current.save();
    });

    expect(updateProfile).toHaveBeenCalledWith({
      city: 'Kailua Town',
      latitude: null,
      longitude: null,
    });
  });
});
