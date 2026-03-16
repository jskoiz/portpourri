import { buildPhotoReorderPlan, getVisibleOrderedPhotos } from '../profilePhotoHelpers';

describe('profilePhotoHelpers', () => {
  const photos = [
    { id: 'photo-3', storageKey: '3', isPrimary: false, isHidden: false, sortOrder: 3 },
    { id: 'photo-1', storageKey: '1', isPrimary: true, isHidden: false, sortOrder: 1 },
    { id: 'photo-2', storageKey: '2', isPrimary: false, isHidden: false, sortOrder: 2 },
    { id: 'photo-hidden', storageKey: 'hidden', isPrimary: false, isHidden: true, sortOrder: 0 },
  ];

  it('returns visible photos sorted by sortOrder', () => {
    expect(getVisibleOrderedPhotos(photos as any).map((photo) => photo.id)).toEqual(['photo-1', 'photo-2', 'photo-3']);
  });

  it('builds the correct swap plan when moving a photo earlier', () => {
    expect(buildPhotoReorderPlan(photos as any, 'photo-2', 'left')).toEqual({
      currentPhotoId: 'photo-2',
      currentSortOrder: 2,
      targetPhotoId: 'photo-1',
      targetSortOrder: 1,
    });
  });

  it('returns null when the requested move is out of bounds', () => {
    expect(buildPhotoReorderPlan(photos as any, 'photo-1', 'left')).toBeNull();
    expect(buildPhotoReorderPlan(photos as any, 'photo-3', 'right')).toBeNull();
  });
});
