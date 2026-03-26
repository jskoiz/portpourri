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

describe('useProfileEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps the user honest when basics save but fitness fails', async () => {
    const updateProfile = jest.fn().mockResolvedValue(undefined);
    const updateFitness = jest.fn().mockRejectedValue(new Error('Fitness save failed'));
    const refetch = jest.fn().mockResolvedValue(undefined);

    const profile = {
      id: 'user-1',
      profile: {
        bio: 'Old bio',
        city: 'Old City',
        intentDating: false,
        intentWorkout: false,
        intentFriends: false,
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

    const { result } = renderHook(() =>
      useProfileEditor({
        profile: profile as never,
        refetch,
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
      result.current.updateCity('Updated City');
      result.current.setIntentDating(true);
      result.current.setIntentWorkout(true);
      result.current.setIntentFriends(true);
      result.current.setIntensityLevel('high');
      result.current.setWeeklyFrequencyBand('5+');
      result.current.setPrimaryGoal('strength');
      result.current.toggleActivity('Surfing');
      result.current.toggleSchedule('Morning');
    });

    await act(async () => {
      await result.current.save();
    });

    expect(updateProfile).toHaveBeenCalledWith({
      bio: 'Updated bio',
      city: 'Updated City',
      latitude: undefined,
      longitude: undefined,
      intentDating: true,
      intentWorkout: true,
      intentFriends: true,
    });
    expect(updateFitness).toHaveBeenCalledWith({
      intensityLevel: 'high',
      weeklyFrequencyBand: '5+',
      primaryGoal: 'strength',
      favoriteActivities: 'Running, Surfing',
      prefersMorning: true,
      prefersEvening: true,
    });
    expect(refetch).toHaveBeenCalled();
    expect(result.current.error).toBe(
      'Profile basics were saved, but fitness settings could not be saved. Please try again.',
    );
    expect(result.current.editMode).toBe(true);
    expect(mockTriggerErrorHaptic).toHaveBeenCalled();
    expect(mockTriggerSuccessHaptic).not.toHaveBeenCalled();
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('does not blame fitness settings when refresh fails after both saves succeed', async () => {
    const updateProfile = jest.fn().mockResolvedValue(undefined);
    const updateFitness = jest.fn().mockResolvedValue(undefined);
    const refetch = jest.fn().mockRejectedValue(new Error('Refresh failed'));

    const profile = {
      id: 'user-1',
      profile: {
        bio: 'Old bio',
        city: 'Old City',
        intentDating: false,
        intentWorkout: false,
        intentFriends: false,
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

    const { result } = renderHook(() =>
      useProfileEditor({
        profile: profile as never,
        refetch,
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

    expect(updateProfile).toHaveBeenCalledTimes(1);
    expect(updateFitness).toHaveBeenCalledTimes(1);
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBe('Refresh failed');
    expect(result.current.editMode).toBe(false);
    expect(mockTriggerSuccessHaptic).toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith('Profile saved', 'success');
    expect(mockTriggerErrorHaptic).toHaveBeenCalled();
    expect(result.current.error).not.toBe(
      'Profile basics were saved, but fitness settings could not be saved. Please try again.',
    );
  });
});
