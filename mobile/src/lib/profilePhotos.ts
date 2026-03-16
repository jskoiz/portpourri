import type { User, UserPhoto } from '../api/types';

type UserPhotoLike = Pick<UserPhoto, 'storageKey' | 'isPrimary' | 'isHidden' | 'sortOrder'>;
type UserLike = Pick<User, 'firstName' | 'photoUrl' | 'photos'>;

function sortVisiblePhotos(photos?: UserPhotoLike[] | null) {
  return (photos ?? [])
    .filter((photo) => !photo.isHidden && Boolean(photo.storageKey))
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getPrimaryPhotoUri(user?: UserLike | null) {
  if (!user) return undefined;

  const visiblePhotos = sortVisiblePhotos(user.photos);
  const primaryPhoto = visiblePhotos.find((photo) => photo.isPrimary);

  return primaryPhoto?.storageKey ?? visiblePhotos[0]?.storageKey ?? user.photoUrl ?? undefined;
}

export function getAvatarInitial(name?: string | null) {
  return name?.trim()?.charAt(0)?.toUpperCase() || '?';
}
