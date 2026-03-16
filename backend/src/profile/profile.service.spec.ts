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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('marks user as onboarded when fitness profile is updated', async () => {
    const profile = {
      userId: 'user-1',
      intensityLevel: IntensityLevel.ADVANCED,
    };
    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<typeof profile>) =>
        fn(prismaMock),
    );
    prismaMock.userFitnessProfile.upsert.mockResolvedValue(profile);

    const result = await service.updateFitnessProfile('user-1', {
      intensityLevel: IntensityLevel.ADVANCED,
    });

    expect(result).toEqual(profile);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isOnboarded: true },
    });
  });

  it('runs fitness upsert and isOnboarded update inside a transaction', async () => {
    const profile = {
      userId: 'user-1',
      intensityLevel: IntensityLevel.ADVANCED,
    };
    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<typeof profile>) =>
        fn(prismaMock),
    );
    prismaMock.userFitnessProfile.upsert.mockResolvedValue(profile);

    await service.updateFitnessProfile('user-1', {
      intensityLevel: IntensityLevel.ADVANCED,
    });

    // Both DB writes must happen inside the same $transaction call
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.userFitnessProfile.upsert).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
  });

  it('strips userId from caller-supplied data in updateFitnessProfile', async () => {
    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock),
    );
    prismaMock.userFitnessProfile.upsert.mockResolvedValue({
      userId: 'user-1',
    });

    await service.updateFitnessProfile('user-1', {
      userId: 'attacker-id',
      intensityLevel: IntensityLevel.BEGINNER,
    });

    const call = prismaMock.userFitnessProfile.upsert.mock.calls[0][0];
    // The create clause must use the authoritative userId, not the one from the body
    expect(call.create.userId).toBe('user-1');
    // The update clause must not contain userId at all
    expect(call.update).not.toHaveProperty('userId');
  });

  it('strips userId from caller-supplied data in updateProfile', async () => {
    prismaMock.userProfile.upsert.mockResolvedValue({ userId: 'user-1' });

    await service.updateProfile('user-1', {
      userId: 'attacker-id',
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

  it('returns null when profile is not found', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    const result = await service.getProfile('missing-user');
    expect(result).toBeNull();
  });

  it('returns null when trying to update a photo that does not belong to the user', async () => {
    prismaMock.userPhoto.findFirst.mockResolvedValue(null);

    const result = await service.updatePhoto('user-1', 'photo-999', {
      isPrimary: true,
    });
    expect(result).toBeNull();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('returns null when trying to delete a photo that does not belong to the user', async () => {
    prismaMock.userPhoto.findFirst.mockResolvedValue(null);

    const result = await service.deletePhoto('user-1', 'photo-999');
    expect(result).toBeNull();
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
