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
    showMeMen: true,
    showMeWomen: true,
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
      city: 'Old City',
      latitude: 21.3,
      longitude: -157.8,
      intentDating: false,
      intentWorkout: false,
      intentFriends: false,
    });
    expect(updateFitness).toHaveBeenCalledWith({
      intensityLevel: 'high',
      weeklyFrequencyBand: '5+',
      primaryGoal: 'strength',
      favoriteActivities: 'Running, Surfing',
      prefersMorning: true,
      prefersEvening: true,
    });
    expect(result.current.error).toBe(
      'Profile basics were saved, but fitness settings could not be saved. Please try again.',
    );
    expect(result.current.editMode).toBe(true);
    expect(result.current.bio).toBe('Updated bio');
    expect(result.current.intensityLevel).toBe('moderate');
    expect(result.current.weeklyFrequencyBand).toBe('3-4');
    expect(result.current.primaryGoal).toBe('connection');
    expect(result.current.selectedActivities).toEqual(['Running']);
    expect(result.current.selectedSchedule).toEqual(['Evening']);
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

    expect(updateProfile).toHaveBeenCalledWith({
      bio: 'Old bio',
      city: 'Old City',
      latitude: 21.3,
      longitude: -157.8,
      intentDating: false,
      intentWorkout: false,
      intentFriends: false,
    });
    expect(updateFitness).toHaveBeenCalledWith({
      intensityLevel: 'moderate',
      weeklyFrequencyBand: '3-4',
      primaryGoal: 'connection',
      favoriteActivities: 'Running',
      prefersMorning: false,
      prefersEvening: true,
    });
    expect(result.current.editMode).toBe(false);
    expect(mockShowToast).toHaveBeenCalledWith('Profile saved', 'success');
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

    expect(result.current.bio).toBe('Remote bio');
  });

  it('shows the current success toast after save', async () => {
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
    expect(mockShowToast).toHaveBeenCalledWith('Profile saved', 'success');
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
      bio: 'Old bio',
      city: 'Kailua Town',
      latitude: undefined,
      longitude: undefined,
      intentDating: false,
      intentWorkout: false,
      intentFriends: false,
    });
  });

  it('only sends discovery flags when the preference actually changes', async () => {
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
      result.current.setDiscoveryPreference('women');
    });

    await act(async () => {
      await result.current.save();
    });

    expect(updateProfile).toHaveBeenCalledWith({
      bio: 'Old bio',
      city: 'Old City',
      latitude: 21.3,
      longitude: -157.8,
      intentDating: false,
      intentWorkout: false,
      intentFriends: false,
      showMeMen: false,
    });
  });

  it('uses the latest loaded profile when discovery flags were unavailable at mount time', async () => {
    const updateProfile = jest.fn().mockResolvedValue(undefined);
    const updateFitness = jest.fn().mockResolvedValue(undefined);
    const profile = makeProfile();

    const { result, rerender } = renderHook<
      ReturnType<typeof useProfileEditor>,
      { currentProfile: ProfileShape | null }
    >(
      ({ currentProfile }) =>
        useProfileEditor({
          profile: currentProfile as never,
          updateProfile,
          updateFitness,
        }),
      { initialProps: { currentProfile: null } },
    );

    rerender({ currentProfile: profile });

    await waitFor(() => {
      expect(result.current.bio).toBe('Old bio');
    });

    act(() => {
      void result.current.save();
    });

    await waitFor(() => {
      expect(result.current.editMode).toBe(true);
    });

    await act(async () => {
      await result.current.save();
    });

    expect(updateProfile).toHaveBeenCalledWith({
      bio: 'Old bio',
      city: 'Old City',
      latitude: 21.3,
      longitude: -157.8,
      intentDating: false,
      intentWorkout: false,
      intentFriends: false,
    });
  });

  it('keeps a stable save callback identity when form fields change', () => {
    const updateProfile = jest.fn().mockResolvedValue(undefined);
    const updateFitness = jest.fn().mockResolvedValue(undefined);
    const profile = makeProfile();

    const { result } = renderHook<
      ReturnType<typeof useProfileEditor>,
      { currentProfile: ProfileShape }
    >(
      ({ currentProfile }) =>
        useProfileEditor({
          profile: currentProfile as never,
          updateProfile,
          updateFitness,
        }),
      { initialProps: { currentProfile: profile } },
    );

    const saveBefore = result.current.save;

    act(() => {
      result.current.setBio('Changed bio');
      result.current.updateCity('New City');
      result.current.setIntensityLevel('high');
      result.current.setIntentDating(true);
      result.current.toggleActivity('Yoga');
      result.current.toggleSchedule('Morning');
    });

    expect(result.current.save).toBe(saveBefore);
  });
});
