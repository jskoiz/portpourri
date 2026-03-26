import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { usePhotoManager } from '../usePhotoManager';

const mockTriggerErrorHaptic = jest.fn();
const mockTriggerSelectionHaptic = jest.fn();
const mockTriggerSuccessHaptic = jest.fn();
const mockShowToast = jest.fn();

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'Images' },
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('../../../../lib/interaction/feedback', () => ({
  triggerErrorHaptic: (...args: unknown[]) => mockTriggerErrorHaptic(...args),
  triggerSelectionHaptic: (...args: unknown[]) => mockTriggerSelectionHaptic(...args),
  triggerSuccessHaptic: (...args: unknown[]) => mockTriggerSuccessHaptic(...args),
}));

jest.mock('../../../../store/toastStore', () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}));

function makeProfile() {
  return {
    id: 'user-1',
    photos: [
      { id: 'photo-1', storageKey: 'one', isPrimary: true, isHidden: false, sortOrder: 0 },
      { id: 'photo-2', storageKey: 'two', isPrimary: false, isHidden: false, sortOrder: 1 },
    ],
  };
}

describe('usePhotoManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports permission denial without calling upload', async () => {
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({
      granted: false,
    } as never);

    const uploadPhoto = jest.fn();
    const setError = jest.fn();

    const { result } = renderHook(() =>
      usePhotoManager({
        profile: makeProfile() as never,
        refetch: jest.fn(),
        uploadPhoto,
        updatePhoto: jest.fn(),
        deletePhoto: jest.fn(),
        setError,
      }),
    );

    await act(async () => {
      await result.current.uploadPhoto();
    });

    expect(uploadPhoto).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Photo library permission is required to upload photos.');
  });

  it('tracks upload progress and refetches after a successful upload', async () => {
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({
      granted: true,
    } as never);
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg', mimeType: 'image/jpeg', fileName: 'photo.jpg' }],
    } as never);

    const refetch = jest.fn().mockResolvedValue(undefined);
    const uploadPhoto = jest.fn().mockImplementation(async ({ onProgress }) => {
      onProgress?.(78);
    });

    const { result } = renderHook(() =>
      usePhotoManager({
        profile: makeProfile() as never,
        refetch,
        uploadPhoto,
        updatePhoto: jest.fn(),
        deletePhoto: jest.fn(),
        setError: jest.fn(),
      }),
    );

    await act(async () => {
      await result.current.uploadPhoto();
    });

    expect(uploadPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        uri: 'file:///photo.jpg',
        fileName: 'photo.jpg',
      }),
    );
    const progressCallback = uploadPhoto.mock.calls[0][0].onProgress;
    expect(progressCallback).toEqual(expect.any(Function));
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(mockTriggerSuccessHaptic).toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith('Photo uploaded', 'success');
  });

  it('keeps reorder out-of-bounds as a no-op', async () => {
    const updatePhoto = jest.fn();

    const { result } = renderHook(() =>
      usePhotoManager({
        profile: {
          id: 'user-1',
          photos: [{ id: 'photo-1', storageKey: 'one', isPrimary: true, isHidden: false, sortOrder: 0 }],
        } as never,
        refetch: jest.fn(),
        uploadPhoto: jest.fn(),
        updatePhoto,
        deletePhoto: jest.fn(),
        setError: jest.fn(),
      }),
    );

    await act(async () => {
      await result.current.movePhotoLeft('photo-1');
    });

    expect(updatePhoto).not.toHaveBeenCalled();
    expect(result.current.photoOperation).toBeNull();
  });

  it('serializes photo mutations while one is already in flight', async () => {
    const refetch = jest.fn().mockResolvedValue(undefined);
    let resolveDelete: (() => void) | null = null;
    const deletePhoto = jest.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        }),
    );
    const updatePhoto = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      usePhotoManager({
        profile: makeProfile() as never,
        refetch,
        uploadPhoto: jest.fn(),
        updatePhoto,
        deletePhoto,
        setError: jest.fn(),
      }),
    );

    await act(async () => {
      const deletePromise = result.current.removePhoto('photo-1');
      await Promise.resolve();
      await result.current.makePrimaryPhoto('photo-2');
      resolveDelete?.();
      await deletePromise;
    });

    expect(deletePhoto).toHaveBeenCalledWith('photo-1');
    expect(updatePhoto).not.toHaveBeenCalled();
  });

  it('restores server state hint when reorder fails', async () => {
    const setError = jest.fn();
    const refetch = jest.fn().mockResolvedValue(undefined);
    const updatePhoto = jest.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() =>
      usePhotoManager({
        profile: makeProfile() as never,
        refetch,
        uploadPhoto: jest.fn(),
        updatePhoto,
        deletePhoto: jest.fn(),
        setError,
      }),
    );

    await act(async () => {
      await result.current.movePhotoRight('photo-1');
    });

    expect(refetch).toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith(
      'We could not confirm the new photo order. Review your photos and try again.',
    );
    expect(mockTriggerErrorHaptic).toHaveBeenCalled();
  });
});
