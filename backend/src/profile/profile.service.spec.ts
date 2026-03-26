import { Test, TestingModule } from '@nestjs/testing';
import { IntensityLevel } from '@prisma/client';
import { ProfileService } from './profile.service';
import { PrismaService } from '../prisma/prisma.service';
import { PhotoStorageService } from './photo-storage.service';

describe('ProfileService', () => {
  let service: ProfileService;

  const prismaMock = {
    userFitnessProfile: {
      upsert: jest.fn(),
    },
    userProfile: {
      upsert: jest.fn(),
    },
    userPhoto: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const photoStorageMock = {
    saveProfilePhoto: jest.fn(),
    removeProfilePhoto: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: PhotoStorageService,
          useValue: photoStorageMock,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  it('marks user as onboarded when fitness profile is updated', async () => {
    const fitnessProfile = {
      userId: 'user-1',
      intensityLevel: IntensityLevel.ADVANCED,
    };
    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<unknown>) =>
        fn(prismaMock),
    );
    prismaMock.userFitnessProfile.upsert.mockResolvedValue(fitnessProfile);
    // getProfile is called after the transaction to return the full user
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      birthdate: null,
      fitnessProfile,
      profile: null,
      photos: [],
    });

    const result = await service.updateFitnessProfile('user-1', {
      intensityLevel: IntensityLevel.ADVANCED,
    });

    expect(result).toMatchObject({ id: 'user-1' });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isOnboarded: true },
    });
  });

  it('runs fitness upsert and isOnboarded update inside a transaction', async () => {
    const fitnessProfile = {
      userId: 'user-1',
      intensityLevel: IntensityLevel.ADVANCED,
    };
    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<unknown>) =>
        fn(prismaMock),
    );
    prismaMock.userFitnessProfile.upsert.mockResolvedValue(fitnessProfile);
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      birthdate: null,
      fitnessProfile,
      profile: null,
      photos: [],
    });

    await service.updateFitnessProfile('user-1', {
      intensityLevel: IntensityLevel.ADVANCED,
    });

    // Both DB writes must happen inside the same $transaction call
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.userFitnessProfile.upsert).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
  });

  it('uses authoritative userId in updateFitnessProfile upsert', async () => {
    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock),
    );
    prismaMock.userFitnessProfile.upsert.mockResolvedValue({
      userId: 'user-1',
    });
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      birthdate: null,
      fitnessProfile: null,
      profile: null,
      photos: [],
    });

    await service.updateFitnessProfile('user-1', {
      intensityLevel: IntensityLevel.BEGINNER,
    });

    const call = prismaMock.userFitnessProfile.upsert.mock.calls[0][0];
    // The create clause must use the authoritative userId from the route param
    expect(call.create.userId).toBe('user-1');
    // The update clause must not contain userId at all
    expect(call.update).not.toHaveProperty('userId');
  });

  it('uses authoritative userId in updateProfile upsert', async () => {
    prismaMock.userProfile.upsert.mockResolvedValue({ userId: 'user-1' });

    await service.updateProfile('user-1', {
      bio: 'hello',
    });

    const call = prismaMock.userProfile.upsert.mock.calls[0][0];
    expect(call.create.userId).toBe('user-1');
    expect(call.update).not.toHaveProperty('userId');
  });

  it('returns null age when birthdate is null', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      birthdate: null,
      fitnessProfile: null,
      profile: null,
      photos: [],
    });

    const result = await service.getProfile('user-1');
    expect(result).not.toBeNull();
    expect(result!.age).toBeNull();
  });

  it('calculates age correctly when birthdate is set', async () => {
    const birthdate = new Date('1990-01-01');
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      birthdate,
      fitnessProfile: null,
      profile: null,
      photos: [],
    });

    const result = await service.getProfile('user-1');
    expect(typeof result!.age).toBe('number');
    expect(result!.age).toBeGreaterThan(30);
  });

  it('strips passwordHash, providerId, and authProvider from getProfile result', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      birthdate: new Date('1995-06-15'),
      passwordHash: 'super-secret-hash',
      providerId: 'provider-xyz',
      authProvider: 'phone',
      fitnessProfile: null,
      profile: null,
      photos: [],
    });

    const result = await service.getProfile('user-1');
    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty('passwordHash');
    expect(result).not.toHaveProperty('providerId');
    expect(result).not.toHaveProperty('authProvider');
    // Safe fields must still be present
    expect(result!.id).toBe('user-1');
  });

  it('strips private account fields from getPublicProfile result', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      birthdate: new Date('1995-06-15'),
      email: 'alice@example.com',
      phoneNumber: '+18085551234',
      hasVerifiedEmail: true,
      hasVerifiedPhone: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      passwordHash: 'super-secret-hash',
      providerId: 'provider-xyz',
      authProvider: 'phone',
      fitnessProfile: null,
      profile: null,
      photos: [],
    });

    const result = await service.getPublicProfile('user-1');

    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('phoneNumber');
    expect(result).not.toHaveProperty('hasVerifiedEmail');
    expect(result).not.toHaveProperty('hasVerifiedPhone');
    expect(result).not.toHaveProperty('createdAt');
    expect(result).not.toHaveProperty('updatedAt');
    expect(result).not.toHaveProperty('birthdate');
    expect(result!.age).toBeGreaterThan(0);
  });

  describe('getProfileCompleteness', () => {
    const makeCompleteUser = (overrides: Record<string, unknown> = {}) => ({
      id: 'user-1',
      firstName: 'Casey',
      birthdate: new Date('1998-06-15T00:00:00.000Z'),
      profile: {
        bio: 'This is a bio that is definitely long enough to pass the check.',
        city: 'Honolulu',
      },
      fitnessProfile: {
        primaryGoal: 'strength',
        intensityLevel: IntensityLevel.INTERMEDIATE,
        prefersMorning: true,
        prefersEvening: false,
      },
      photos: [
        { id: 'p1', storageKey: 'p1.jpg' },
        { id: 'p2', storageKey: 'p2.jpg' },
      ],
      ...overrides,
    });

    it('returns a full completeness payload for a complete profile', async () => {
      prismaMock.user.findUnique.mockResolvedValue(makeCompleteUser());

      const result = await service.getProfileCompleteness('user-1');

      expect(result).toEqual({
        score: 100,
        total: 8,
        earned: 8,
        prompts: [],
        missing: [],
      });
    });

    it('returns the full missing checklist for a missing profile', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.getProfileCompleteness('ghost');

      expect(result).toEqual({
        score: 0,
        total: 8,
        earned: 0,
        prompts: ['Complete your profile setup.'],
        missing: expect.arrayContaining([
          expect.objectContaining({
            field: 'firstName',
            label: 'Add your first name',
            route: 'EditProfile',
          }),
          expect.objectContaining({
            field: 'photos',
            label: 'Add more photos',
            route: 'EditPhotos',
          }),
        ]),
      });
    });

    it('returns a partial score and the unmet profile prompts', async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        makeCompleteUser({
          profile: { bio: null, city: 'Honolulu' },
          photos: [],
        }),
      );

      const result = await service.getProfileCompleteness('user-1');

      expect(result.score).toBe(75);
      expect(result.earned).toBe(6);
      expect(result.total).toBe(8);
      expect(result.prompts).toEqual(
        expect.arrayContaining([
          'Write a bio (20+ chars) so people know your vibe.',
          'Upload at least 2 profile photos.',
        ]),
      );
      expect(result.missing.map((item) => item.field)).toEqual(
        expect.arrayContaining(['bio', 'photos']),
      );
    });
  });

  it('uploads photos with deterministic ordering', async () => {
    photoStorageMock.saveProfilePhoto.mockResolvedValue({
      storageKey: 'http://local/photo-1.jpg',
    });
    prismaMock.userPhoto.findMany.mockResolvedValue([
      { sortOrder: 0, isHidden: false },
    ]);
    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock),
    );
    prismaMock.userPhoto.create.mockResolvedValue({
      id: 'photo-1',
      sortOrder: 1,
    });

    const result = await service.uploadPhoto('user-1', {
      mimetype: 'image/jpeg',
      buffer: Buffer.from('img'),
    } as Express.Multer.File);

    expect(result).toEqual({ id: 'photo-1', sortOrder: 1 });
    expect(prismaMock.userPhoto.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        sortOrder: 1,
        storageKey: 'http://local/photo-1.jpg',
      }),
    });
  });

  it('clears previous primary photo when setting a new one', async () => {
    prismaMock.userPhoto.findFirst.mockResolvedValue({
      id: 'photo-1',
      userId: 'user-1',
    });
    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock),
    );
    prismaMock.userPhoto.update.mockResolvedValue({
      id: 'photo-1',
      isPrimary: true,
      isHidden: false,
    });

    await service.updatePhoto('user-1', 'photo-1', { isPrimary: true });

    expect(prismaMock.userPhoto.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { isPrimary: false },
    });
  });

  it('throws NotFoundException when profile is not found', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    await expect(service.getProfile('missing-user')).rejects.toThrow(
      'Profile not found',
    );
  });

  it('throws NotFoundException when trying to update a photo that does not belong to the user', async () => {
    prismaMock.userPhoto.findFirst.mockResolvedValue(null);

    await expect(
      service.updatePhoto('user-1', 'photo-999', { isPrimary: true }),
    ).rejects.toThrow('Photo not found');
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when trying to delete a photo that does not belong to the user', async () => {
    prismaMock.userPhoto.findFirst.mockResolvedValue(null);

    await expect(
      service.deletePhoto('user-1', 'photo-999'),
    ).rejects.toThrow('Photo not found');
  });

  it('sets first uploaded photo as primary when all existing photos are hidden', async () => {
    photoStorageMock.saveProfilePhoto.mockResolvedValue({
      storageKey: 'http://local/photo-2.jpg',
    });
    prismaMock.userPhoto.findMany.mockResolvedValue([
      { sortOrder: 0, isHidden: true },
    ]);
    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock),
    );
    prismaMock.userPhoto.create.mockResolvedValue({
      id: 'photo-2',
      sortOrder: 1,
      isPrimary: true,
    });

    const result = await service.uploadPhoto('user-1', {
      mimetype: 'image/jpeg',
      buffer: Buffer.from('img'),
    } as Express.Multer.File);

    expect(result).toEqual({ id: 'photo-2', sortOrder: 1, isPrimary: true });
    // Should clear other primary flags
    expect(prismaMock.userPhoto.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { isPrimary: false },
    });
  });

  it('hides deleted photos and promotes the next visible photo', async () => {
    prismaMock.userPhoto.findFirst
      .mockResolvedValueOnce({
        id: 'photo-1',
        userId: 'user-1',
        storageKey: 'http://local/photo-1.jpg',
      })
      .mockResolvedValueOnce({
        id: 'photo-2',
        userId: 'user-1',
        isHidden: false,
      });
    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock),
    );
    prismaMock.userPhoto.update.mockResolvedValue({
      id: 'photo-1',
      isHidden: true,
      isPrimary: false,
    });

    const result = await service.deletePhoto('user-1', 'photo-1');

    expect(result).toEqual({ id: 'photo-1', isHidden: true, isPrimary: false });
    expect(photoStorageMock.removeProfilePhoto).toHaveBeenCalledWith(
      'http://local/photo-1.jpg',
    );
    expect(prismaMock.userPhoto.update).toHaveBeenCalledWith({
      where: { id: 'photo-2' },
      data: { isPrimary: true },
    });
  });
});
