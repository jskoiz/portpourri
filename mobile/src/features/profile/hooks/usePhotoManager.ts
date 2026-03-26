import { useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import type { User } from '../../../api/types';
import { normalizeApiError } from '../../../api/errors';
import { triggerErrorHaptic, triggerSelectionHaptic, triggerSuccessHaptic } from '../../../lib/interaction/feedback';
import { showToast } from '../../../store/toastStore';
import { buildPhotoReorderPlan } from './profilePhotoHelpers';

export type PhotoOperationState =
  | { type: 'upload'; label: string; progress: number; photoId?: undefined }
  | { type: 'primary' | 'delete' | 'reorder'; label: string; photoId: string; progress?: undefined }
  | null;

export function usePhotoManager({
  profile,
  refetch,
  uploadPhoto,
  updatePhoto,
  deletePhoto,
  setError,
}: {
  profile: User | null;
  refetch: () => Promise<unknown>;
  uploadPhoto: (payload: {
    uri: string;
    mimeType?: string | null;
    fileName?: string | null;
    onProgress?: (progress: number) => void;
  }) => Promise<unknown>;
  updatePhoto: (payload: { photoId: string; payload: { isPrimary?: boolean; sortOrder?: number } }) => Promise<unknown>;
  deletePhoto: (photoId: string) => Promise<unknown>;
  setError: (error: string | null) => void;
}) {
  const [photoOperation, setPhotoOperation] = useState<PhotoOperationState>(null);
  const activeRequestIdRef = useRef(0);
  const isMutatingRef = useRef(false);
  const [isMutating, setIsMutating] = useState(false);

  const setOperationForRequest = (requestId: number, operation: PhotoOperationState) => {
    if (activeRequestIdRef.current === requestId) {
      setPhotoOperation(operation);
    }
  };

  const reconcileAfterMutation = async (successMessage: string) => {
    try {
      await refetch();
      showToast(successMessage, 'success');
    } catch {
      showToast('Photo updated, but we could not refresh the latest profile. Pull to refresh if anything looks stale.', 'warning');
    }
  };

  const runExclusiveOperation = async (
    initialOperation: PhotoOperationState,
    action: (requestId: number) => Promise<void>,
  ) => {
    if (isMutatingRef.current) {
      return false;
    }

    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
    isMutatingRef.current = true;
    setIsMutating(true);
    setError(null);
    setPhotoOperation(initialOperation);

    try {
      await action(requestId);
      return true;
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setPhotoOperation(null);
        isMutatingRef.current = false;
        setIsMutating(false);
      }
    }
  };

  const pickAndUploadPhoto = async () => {
    await runExclusiveOperation({ type: 'upload', label: 'Uploading photo…', progress: 5 }, async (requestId) => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Photo library permission is required to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.72,
      });
      if (result.canceled || !result.assets.length) {
        return;
      }

      const asset = result.assets[0];
      try {
        await uploadPhoto({
          uri: asset.uri,
          mimeType: asset.mimeType,
          fileName: asset.fileName,
          onProgress: (progress) => {
            setOperationForRequest(requestId, {
              type: 'upload',
              label: progress >= 100 ? 'Finalizing photo…' : `Uploading photo… ${progress}%`,
              progress,
            });
          },
        });
        void triggerSuccessHaptic();
        await reconcileAfterMutation('Photo uploaded');
      } catch (err) {
        void triggerErrorHaptic();
        setError(normalizeApiError(err).message);
      }
    });
  };

  const updatePhotoOrder = async (photoId: string, direction: 'left' | 'right') => {
    const reorderPlan = buildPhotoReorderPlan(profile?.photos, photoId, direction);
    if (!reorderPlan) return;

    await runExclusiveOperation({ type: 'reorder', photoId, label: 'Reordering photos…' }, async () => {
      try {
        await Promise.all([
          updatePhoto({
            photoId: reorderPlan.currentPhotoId,
            payload: { sortOrder: reorderPlan.targetSortOrder },
          }),
          updatePhoto({
            photoId: reorderPlan.targetPhotoId,
            payload: { sortOrder: reorderPlan.currentSortOrder },
          }),
        ]);
        void triggerSelectionHaptic();
        await reconcileAfterMutation('Photo order saved');
      } catch {
        await refetch().catch(() => undefined);
        void triggerErrorHaptic();
        setError('We could not confirm the new photo order. Review your photos and try again.');
      }
    });
  };

  return {
    photoOperation,
    isEditingPhotos: isMutating,
    uploadPhoto: pickAndUploadPhoto,
    makePrimaryPhoto: async (photoId: string) => {
      await runExclusiveOperation({ type: 'primary', photoId, label: 'Setting primary photo…' }, async () => {
        try {
          await updatePhoto({ photoId, payload: { isPrimary: true } });
          void triggerSelectionHaptic();
          await reconcileAfterMutation('Primary photo updated');
        } catch (err) {
          void triggerErrorHaptic();
          setError(normalizeApiError(err).message);
        }
      });
    },
    movePhotoLeft: async (photoId: string) => updatePhotoOrder(photoId, 'left'),
    movePhotoRight: async (photoId: string) => updatePhotoOrder(photoId, 'right'),
    removePhoto: async (photoId: string) => {
      await runExclusiveOperation({ type: 'delete', photoId, label: 'Removing photo…' }, async () => {
        try {
          await deletePhoto(photoId);
          void triggerSuccessHaptic();
          await reconcileAfterMutation('Photo removed');
        } catch (err) {
          void triggerErrorHaptic();
          setError(normalizeApiError(err).message);
        }
      });
    },
  };
}
