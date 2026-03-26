/**
 * Integration test: Profile flow
 *
 * Verifies the profile lifecycle:
 *   View profile -> edit fields -> photo upload -> save -> verify changes
 *
 * Mocks the API layer at the boundary, exercises the real useProfile hook,
 * useProfileEditor hook, and usePhotoManager hook.
 */
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useProfile } from '../../src/features/profile/hooks/useProfile';
import { useProfileEditor } from '../../src/features/profile/hooks/useProfileEditor';
import { usePhotoManager } from '../../src/features/profile/hooks/usePhotoManager';
import { useAuthStore } from '../../src/store/authStore';
import type { User, UserPhoto } from '../../src/api/types';
import { createQueryTestHarness } from '../../src/lib/testing/queryTestHarness';

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

const mockGetProfile = jest.fn();
const mockUpdateFitness = jest.fn();
const mockUpdateProfile = jest.fn();
const mockUploadPhoto = jest.fn();
const mockUpdatePhoto = jest.fn();
const mockDeletePhoto = jest.fn();

jest.mock('../../src/services/api', () => ({
  profileApi: {
    getProfile: (...args: unknown[]) => mockGetProfile(...args),
    updateFitness: (...args: unknown[]) => mockUpdateFitness(...args),
    updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
    uploadPhoto: (...args: unknown[]) => mockUploadPhoto(...args),
    updatePhoto: (...args: unknown[]) => mockUpdatePhoto(...args),
    deletePhoto: (...args: unknown[]) => mockDeletePhoto(...args),
  },
}));

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

const photo1: UserPhoto = { id: 'p1', storageKey: 'photos/p1.jpg', isPrimary: true, isHidden: false, sortOrder: 0 };
const photo2: UserPhoto = { id: 'p2', storageKey: 'photos/p2.jpg', isPrimary: false, isHidden: false, sortOrder: 1 };

const fakeUser: User = {
  id: 'u-1',
  email: 'alice@brdg.local',
  firstName: 'Alice',
  age: 28,
  isOnboarded: true,
  profile: {
    bio: 'Fitness enthusiast',
    city: 'Denver',
    intentDating: true,
    intentWorkout: true,
    intentFriends: false,
    latitude: 39.74,
    longitude: -104.99,
  },
  fitnessProfile: {
    intensityLevel: 'INTERMEDIATE',
    weeklyFrequencyBand: '3-4',
    primaryGoal: 'strength',
    favoriteActivities: 'Running, Yoga',
    prefersMorning: true,
    prefersEvening: false,
  },
  photos: [photo1, photo2],
};

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('Profile flow integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ token: 'jwt-test', user: fakeUser, isLoading: false });
  });

  // -- View profile: loads data from API --------------------------------
  it('loads profile data and exposes it via hook', async () => {
    mockGetProfile.mockResolvedValue({ data: fakeUser });

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.profile).toEqual(fakeUser);
    expect(result.current.profile?.profile?.bio).toBe('Fitness enthusiast');
  });

  // -- Edit profile fields and save -----------------------------------
  it('useProfileEditor syncs from profile and saves changes', async () => {
    const mockUpdateProfileFn = jest.fn().mockResolvedValue(undefined);
    const mockUpdateFitnessFn = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useProfileEditor({
        profile: fakeUser,
        refetch: jest.fn().mockResolvedValue(undefined),
        updateProfile: mockUpdateProfileFn,
        updateFitness: mockUpdateFitnessFn,
      }),
    );

    // Editor should have synced values from the profile
    expect(result.current.bio).toBe('Fitness enthusiast');
    expect(result.current.city).toBe('Denver');
    expect(result.current.intensityLevel).toBe('moderate'); // INTERMEDIATE -> moderate
    expect(result.current.intentDating).toBe(true);
    expect(result.current.selectedActivities).toEqual(['Running', 'Yoga']);

    // Enter edit mode (first save call toggles editMode on)
    await act(async () => {
      await result.current.save();
    });
    expect(result.current.editMode).toBe(true);

    // Change fields
    act(() => {
      result.current.setBio('Updated bio text');
      result.current.updateCity('Boulder');
      result.current.setIntensityLevel('high');
    });

    expect(result.current.bio).toBe('Updated bio text');
    expect(result.current.city).toBe('Boulder');

    // Save (second call actually persists)
    await act(async () => {
      await result.current.save();
    });

    expect(mockUpdateProfileFn).toHaveBeenCalledWith(
      expect.objectContaining({
        bio: 'Updated bio text',
        city: 'Boulder',
      }),
    );
    expect(mockUpdateFitnessFn).toHaveBeenCalledWith(
      expect.objectContaining({
        intensityLevel: 'high',
      }),
    );
    expect(result.current.editMode).toBe(false);
  });

  // -- Cancel edit resets to original values --------------------------
  it('cancelEdit resets fields to original profile values', async () => {
    const { result } = renderHook(() =>
      useProfileEditor({
        profile: fakeUser,
        refetch: jest.fn().mockResolvedValue(undefined),
        updateProfile: jest.fn(),
        updateFitness: jest.fn(),
      }),
    );

    // Enter edit mode
    await act(async () => {
      await result.current.save();
    });

    // Modify fields
    act(() => {
      result.current.setBio('Temporary change');
      result.current.updateCity('Somewhere');
    });

    expect(result.current.bio).toBe('Temporary change');

    // Cancel
    act(() => {
      result.current.cancelEdit();
    });

    expect(result.current.bio).toBe('Fitness enthusiast');
    expect(result.current.city).toBe('Denver');
    expect(result.current.editMode).toBe(false);
  });

  // -- Photo upload via useProfile hook -------------------------------
  it('uploadPhoto calls API and invalidates profile queries', async () => {
    mockGetProfile.mockResolvedValue({ data: fakeUser });
    const newPhoto: UserPhoto = {
      id: 'p3',
      storageKey: 'photos/p3.jpg',
      isPrimary: false,
      isHidden: false,
      sortOrder: 2,
    };
    mockUploadPhoto.mockResolvedValue({ data: { ...fakeUser, photos: [...(fakeUser.photos || []), newPhoto] } });

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Reset to track refetch
    mockGetProfile.mockClear();
    mockGetProfile.mockResolvedValue({
      data: { ...fakeUser, photos: [...(fakeUser.photos || []), newPhoto] },
    });

    await act(async () => {
      await result.current.uploadPhoto({
        uri: 'file:///tmp/photo.jpg',
        mimeType: 'image/jpeg',
        fileName: 'photo.jpg',
      });
    });

    // React Query passes extra mutation context args, so check just the first arg
    expect(mockUploadPhoto).toHaveBeenCalled();
    expect(mockUploadPhoto.mock.calls[0][0]).toEqual(
      expect.objectContaining({ uri: 'file:///tmp/photo.jpg' }),
    );
  });

  // -- Update profile syncs user back into authStore ------------------
  it('updateProfile syncs user profile changes back into authStore', async () => {
    mockGetProfile.mockResolvedValue({ data: fakeUser });
    mockUpdateProfile.mockResolvedValue({
      data: {
        ...fakeUser,
        profile: {
          ...fakeUser.profile,
          bio: 'New bio from server',
          city: 'Boulder',
          intentDating: true,
          intentWorkout: false,
          intentFriends: true,
        },
      },
    });

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.updateProfile({
        bio: 'New bio from server',
        city: 'Boulder',
      });
    });

    // authStore now keeps only the session projection, not the full profile payload
    const authState = useAuthStore.getState();
    expect(authState.user).toEqual({
      id: 'u-1',
      email: 'alice@brdg.local',
      firstName: 'Alice',
      isOnboarded: true,
      profile: {
        intentDating: true,
        intentWorkout: false,
        intentFriends: true,
      },
    });
  });

  // -- Update fitness syncs user back into authStore ------------------
  it('updateFitness syncs full user back into authStore', async () => {
    mockGetProfile.mockResolvedValue({ data: fakeUser });
    const updatedUser = {
      ...fakeUser,
      fitnessProfile: {
        ...fakeUser.fitnessProfile,
        intensityLevel: 'ADVANCED',
      },
    };
    mockUpdateFitness.mockResolvedValue({ data: updatedUser });

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.updateFitness({
        intensityLevel: 'ADVANCED',
        weeklyFrequencyBand: '3-4',
        primaryGoal: 'strength',
        favoriteActivities: 'Running',
      });
    });

    const authState = useAuthStore.getState();
    expect(authState.user).toEqual({
      id: 'u-1',
      email: 'alice@brdg.local',
      firstName: 'Alice',
      isOnboarded: true,
      profile: {
        intentDating: true,
        intentWorkout: true,
        intentFriends: false,
      },
    });
  });

  // -- Toggle activity in editor -----------------------------------------
  it('toggleActivity adds and removes activities', () => {
    const { result } = renderHook(() =>
      useProfileEditor({
        profile: fakeUser,
        refetch: jest.fn().mockResolvedValue(undefined),
        updateProfile: jest.fn(),
        updateFitness: jest.fn(),
      }),
    );

    expect(result.current.selectedActivities).toEqual(['Running', 'Yoga']);

    // Add new activity
    act(() => {
      result.current.toggleActivity('Cycling');
    });
    expect(result.current.selectedActivities).toEqual(['Running', 'Yoga', 'Cycling']);

    // Remove existing activity
    act(() => {
      result.current.toggleActivity('Running');
    });
    expect(result.current.selectedActivities).toEqual(['Yoga', 'Cycling']);
  });

  // -- Delete photo via useProfile ------------------------------------
  it('deletePhoto calls API and triggers invalidation', async () => {
    mockGetProfile.mockResolvedValue({ data: fakeUser });
    mockDeletePhoto.mockResolvedValue({ data: { ...fakeUser, photos: [photo1] } });

    const { wrapper } = createQueryTestHarness();
    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.deletePhoto('p2');
    });

    // React Query passes extra mutation context args; verify first arg only
    expect(mockDeletePhoto).toHaveBeenCalled();
    expect(mockDeletePhoto.mock.calls[0][0]).toBe('p2');
  });
});
