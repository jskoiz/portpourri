import React from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { RefObject } from 'react';
import type { UserPhoto } from '../../../../api/types';
import { AppBottomSheet, APP_BOTTOM_SHEET_SNAP_POINTS } from '../../../../design/sheets/AppBottomSheet';
import { PhotoManager } from '../ProfileSections';
import type { PhotoOperationState } from '../../hooks/usePhotoManager';

export function EditPhotosSheet({
  editingPhotos,
  onDeletePhoto,
  onDismiss,
  onMakePrimaryPhoto,
  onMovePhotoLeft,
  onMovePhotoRight,
  onUploadPhoto,
  photoOperation,
  photos,
  refObject,
  visible,
}: {
  editingPhotos: boolean;
  onDeletePhoto: (photoId: string) => void;
  onDismiss: () => void;
  onMakePrimaryPhoto: (photoId: string) => void;
  onMovePhotoLeft: (photoId: string) => void;
  onMovePhotoRight: (photoId: string) => void;
  onUploadPhoto: () => void;
  photoOperation: PhotoOperationState;
  photos: UserPhoto[];
  refObject: RefObject<BottomSheetModal | null>;
  visible: boolean;
}) {
  return (
    <AppBottomSheet
      refObject={refObject}
      visible={visible}
      onDismiss={onDismiss}
      title="Edit Photos"
      snapPoints={APP_BOTTOM_SHEET_SNAP_POINTS.tall}
    >
      <PhotoManager
        canEdit
        isBusy={editingPhotos}
        onDelete={onDeletePhoto}
        onMakePrimary={onMakePrimaryPhoto}
        onMoveLeft={onMovePhotoLeft}
        onMoveRight={onMovePhotoRight}
        onUpload={onUploadPhoto}
        operation={photoOperation}
        photos={photos}
      />
    </AppBottomSheet>
  );
}
