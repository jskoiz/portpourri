import { getAvatarInitial, getPrimaryPhotoUri } from '../profilePhotos';

describe('profilePhotos', () => {
  it('prefers the visible primary photo over legacy photoUrl', () => {
    const user = {
      firstName: 'Jordan',
      photoUrl: 'https://cdn.example.com/legacy.jpg',
      photos: [
        { storageKey: 'https://cdn.example.com/secondary.jpg', isPrimary: false, isHidden: false, sortOrder: 1 },
        { storageKey: 'https://cdn.example.com/primary.jpg', isPrimary: true, isHidden: false, sortOrder: 2 },
      ],
    };

    expect(getPrimaryPhotoUri(user as any)).toBe('https://cdn.example.com/primary.jpg');
  });

  it('falls back to the first visible ordered photo when no primary flag is set', () => {
    const user = {
      photos: [
        { storageKey: 'https://cdn.example.com/later.jpg', isPrimary: false, isHidden: false, sortOrder: 4 },
        { storageKey: 'https://cdn.example.com/earlier.jpg', isPrimary: false, isHidden: false, sortOrder: 1 },
      ],
    };

    expect(getPrimaryPhotoUri(user as any)).toBe('https://cdn.example.com/earlier.jpg');
  });

  it('uses the legacy photoUrl only when there are no visible photos', () => {
    const user = {
      photoUrl: 'https://cdn.example.com/legacy.jpg',
      photos: [
        { storageKey: 'https://cdn.example.com/hidden.jpg', isPrimary: true, isHidden: true, sortOrder: 0 },
      ],
    };

    expect(getPrimaryPhotoUri(user as any)).toBe('https://cdn.example.com/legacy.jpg');
  });

  it('returns a stable avatar initial', () => {
    expect(getAvatarInitial(' kai ')).toBe('K');
    expect(getAvatarInitial('')).toBe('?');
    expect(getAvatarInitial(undefined)).toBe('?');
  });
});
