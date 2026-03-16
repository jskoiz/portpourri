import type { UserPhoto } from '../../../api/types';

export type PhotoReorderPlan = {
  currentPhotoId: string;
  currentSortOrder: number;
  targetPhotoId: string;
  targetSortOrder: number;
};

export function getVisibleOrderedPhotos(photos?: UserPhoto[] | null) {
  return (photos ?? [])
    .filter((photo) => !photo.isHidden)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function buildPhotoReorderPlan(
  photos: UserPhoto[] | null | undefined,
  photoId: string,
  direction: 'left' | 'right',
): PhotoReorderPlan | null {
  const visiblePhotos = getVisibleOrderedPhotos(photos);
  const index = visiblePhotos.findIndex((photo) => photo.id === photoId);
  if (index === -1) return null;

  const targetIndex = direction === 'left' ? index - 1 : index + 1;
  const target = visiblePhotos[targetIndex];
  if (!target) return null;

  return {
    currentPhotoId: photoId,
    currentSortOrder: visiblePhotos[index].sortOrder,
    targetPhotoId: target.id,
    targetSortOrder: target.sortOrder,
  };
}
