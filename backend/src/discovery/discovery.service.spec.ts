import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';
import { Gender, IntensityLevel } from '@prisma/client';
import { DiscoveryService } from './discovery.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BlockService } from '../moderation/block.service';

describe('DiscoveryService', () => {
  let service: DiscoveryService;
  let debugSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaMock: any = {
    like: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    pass: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    userProfile: {
      findMany: jest.fn(),
    },
    match: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn(prismaMock),
    ),
  };

  const notificationsMock = {
    create: jest.fn().mockResolvedValue(undefined),
  };

  const blockServiceMock = {
    getBlockedUserIds: jest.fn().mockResolvedValue([]),
    isBlocked: jest.fn().mockResolvedValue(false),
  };

  const cacheMock = {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  const makeCandidate = (overrides: Record<string, unknown> = {}) => {
    const baseCandidate = {
      id: 'candidate-1',
      firstName: 'Casey',
      birthdate: new Date('1998-06-15T00:00:00.000Z'),
      profile: {
        city: 'Honolulu',
        bio: 'Runner and lifter who likes sunrise sessions.',
        latitude: 21.3069,
        longitude: -157.8583,
        intentDating: true,
        intentWorkout: true,
        intentFriends: false,
      },
      fitnessProfile: {
        primaryGoal: 'strength',
        secondaryGoal: 'endurance',
        intensityLevel: IntensityLevel.INTERMEDIATE,
        prefersMorning: true,
        prefersEvening: false,
        favoriteActivities: null,
      },
      photos: [
        {
          id: 'photo-1',
          storageKey: 'photo-1.jpg',
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    };

    return {
      ...baseCandidate,
      ...overrides,
      profile: {
        ...baseCandidate.profile,
        ...(overrides.profile as Record<string, unknown> | undefined),
      },
      fitnessProfile: {
        ...baseCandidate.fitnessProfile,
        ...(overrides.fitnessProfile as Record<string, unknown> | undefined),
      },
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    debugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscoveryService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: NotificationsService,
          useValue: notificationsMock,
        },
        {
          provide: BlockService,
          useValue: blockServiceMock,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheMock,
        },
      ],
    }).compile();

    service = module.get<DiscoveryService>(DiscoveryService);

    // Default: target user exists (tests that need it missing will override)
    prismaMock.user.findFirst.mockResolvedValue({ id: 'user-2' });

    // Restore default block-service behaviour cleared by clearAllMocks
    blockServiceMock.getBlockedUserIds.mockResolvedValue([]);
    blockServiceMock.isBlocked.mockResolvedValue(false);
  });

  afterEach(() => {
    debugSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('excludes blocked user IDs from the feed query', async () => {
    blockServiceMock.getBlockedUserIds.mockResolvedValue(['blocked-1', 'blocked-2']);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'me',
      gender: Gender.MALE,
      showMeMen: true,
      showMeWomen: true,
      profile: { latitude: 21.3, longitude: -157.8 },
      fitnessProfile: {
        intensityLevel: IntensityLevel.INTERMEDIATE,
        primaryGoal: 'strength',
        secondaryGoal: 'endurance',
      },
    });
    prismaMock.user.findMany.mockResolvedValue([]);

    await service.getFeed('me');

    const query = prismaMock.user.findMany.mock.calls[0][0];
    expect(query.where.id).toEqual({ notIn: ['me', 'blocked-1', 'blocked-2'] });
  });

  it('pushes like/pass exclusions and profile filters into the feed query', async () => {
    blockServiceMock.getBlockedUserIds.mockResolvedValue(['blocked-1', 'blocked-2']);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'me',
      gender: Gender.MALE,
      showMeMen: true,
      showMeWomen: true,
      profile: {
        latitude: 21.3,
        longitude: -157.8,
      },
      fitnessProfile: {
        intensityLevel: IntensityLevel.INTERMEDIATE,
        primaryGoal: 'strength',
        secondaryGoal: 'endurance',
      },
    });
    prismaMock.user.findMany.mockResolvedValue([makeCandidate()]);

    await service.getFeed('me', {
      minAge: 25,
      maxAge: 32,
      goals: ['Strength'],
      intensity: ['INTERMEDIATE'],
      availability: ['morning', 'evening'],
    });

    expect(prismaMock.like.findMany).not.toHaveBeenCalled();
    expect(prismaMock.pass.findMany).not.toHaveBeenCalled();
    expect(prismaMock.user.findMany).toHaveBeenCalledTimes(1);

    const query = prismaMock.user.findMany.mock.calls[0][0];
    expect(query.where.id).toEqual({ notIn: ['me', 'blocked-1', 'blocked-2'] });
    expect(query.where.receivedLikes).toEqual({ none: { fromUserId: 'me' } });
    expect(query.where.receivedPasses).toEqual({ none: { fromUserId: 'me' } });
    expect(query.where.gender).toEqual({
      in: [Gender.MALE, Gender.FEMALE],
    });
    expect(query.where.birthdate).toEqual(
      expect.objectContaining({
        gte: expect.any(Date),
        lte: expect.any(Date),
      }),
    );
    expect(query.where.fitnessProfile).toEqual({
      is: {
        AND: [
          {
            OR: [
              {
                primaryGoal: {
                  equals: 'strength',
                  mode: 'insensitive',
                },
              },
              {
                secondaryGoal: {
                  equals: 'strength',
                  mode: 'insensitive',
                },
              },
            ],
          },
          {
            intensityLevel: {
              in: [IntensityLevel.INTERMEDIATE],
            },
          },
          {
            OR: [{ prefersMorning: true }, { prefersEvening: true }],
          },
        ],
      },
    });
    expect(query.select.profile).toEqual({
      select: {
        city: true,
        bio: true,
        latitude: true,
        longitude: true,
        intentDating: true,
        intentWorkout: true,
        intentFriends: true,
      },
    });
  });

  it('still filters distance after the database query and returns top scored results', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'me',
      gender: Gender.MALE,
      showMeMen: true,
      showMeWomen: true,
      profile: {
        latitude: 21.3069,
        longitude: -157.8583,
      },
      fitnessProfile: {
        intensityLevel: IntensityLevel.INTERMEDIATE,
        primaryGoal: 'strength',
        secondaryGoal: 'mobility',
      },
    });
    prismaMock.user.findMany.mockResolvedValue([
      makeCandidate({
        id: 'nearby-match',
        birthdate: new Date('1997-05-01T00:00:00.000Z'),
        profile: {
          city: 'Honolulu',
          bio: 'Close by',
          latitude: 21.307,
          longitude: -157.8584,
        },
      }),
      makeCandidate({
        id: 'far-away',
        birthdate: new Date('1997-05-01T00:00:00.000Z'),
        profile: {
          city: 'Tokyo',
          bio: 'Very far away',
          latitude: 35.6764,
          longitude: 139.65,
        },
      }),
    ]);

    const result = await service.getFeed('me', { distanceKm: 10 });

    expect(result).toHaveLength(1);
    expect(result.map((candidate) => candidate!.id)).toEqual(['nearby-match']);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'nearby-match',
        age: expect.any(Number),
        distanceKm: expect.any(Number),
        recommendationScore: expect.any(Number),
        profile: {
          city: 'Honolulu',
          bio: 'Close by',
          intentDating: true,
          intentWorkout: true,
          intentFriends: false,
        },
      }),
    );
    expect(result[0]?.distanceKm).toBeLessThan(10);
    expect(result[0]?.distanceKm).not.toBeNull();
    expect(result[0]?.recommendationScore).toBeGreaterThan(0);
    expect(result[0]?.profile).not.toHaveProperty('latitude');
    expect(result[0]?.profile).not.toHaveProperty('longitude');
  });

  it('excludes candidates with unknown coordinates when distance filtering is enabled', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'me',
      gender: Gender.MALE,
      showMeMen: true,
      showMeWomen: true,
      profile: {
        latitude: 21.3069,
        longitude: -157.8583,
      },
      fitnessProfile: {
        intensityLevel: IntensityLevel.INTERMEDIATE,
        primaryGoal: 'strength',
        secondaryGoal: 'mobility',
      },
    });
    prismaMock.user.findMany.mockResolvedValue([
      makeCandidate({
        id: 'nearby-match',
        profile: {
          city: 'Honolulu',
          bio: 'Close by',
          latitude: 21.307,
          longitude: -157.8584,
        },
      }),
      makeCandidate({
        id: 'unknown-location',
        profile: {
          city: 'Honolulu',
          bio: 'No coordinates yet',
          latitude: null,
          longitude: null,
        },
      }),
    ]);

    const result = await service.getFeed('me', { distanceKm: 10 });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'nearby-match',
      }),
    );
  });

  it('keeps candidates when the requester has no coordinates even if a distance filter is set', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'me',
      gender: Gender.MALE,
      showMeMen: true,
      showMeWomen: true,
      profile: {
        latitude: null,
        longitude: null,
      },
      fitnessProfile: {
        intensityLevel: IntensityLevel.INTERMEDIATE,
        primaryGoal: 'strength',
        secondaryGoal: 'mobility',
      },
    });
    prismaMock.user.findMany.mockResolvedValue([
      makeCandidate({
        id: 'known-location',
      }),
      makeCandidate({
        id: 'unknown-location',
        profile: {
          city: 'Honolulu',
          bio: 'No coordinates yet',
          latitude: null,
          longitude: null,
        },
      }),
    ]);

    const result = await service.getFeed('me', { distanceKm: 50 });

    expect(result).toHaveLength(2);
    expect(result.map((candidate) => candidate?.id)).toEqual(
      expect.arrayContaining(['known-location', 'unknown-location']),
    );
  });

  it('returns an empty feed when no candidates match the query', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'me',
      gender: Gender.MALE,
      showMeMen: true,
      showMeWomen: true,
      profile: {
        latitude: 21.3069,
        longitude: -157.8583,
      },
      fitnessProfile: {
        intensityLevel: IntensityLevel.INTERMEDIATE,
        primaryGoal: 'strength',
        secondaryGoal: 'mobility',
      },
    });
    prismaMock.user.findMany.mockResolvedValue([]);

    const result = await service.getFeed('me', { distanceKm: 10 });

    expect(result).toEqual([]);
    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
      }),
    );
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining('"event":"discovery.feed.generated"'),
    );
  });

  it('returns feed entries sorted by recommendation score and strips coordinates', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'me',
      gender: Gender.MALE,
      showMeMen: true,
      showMeWomen: true,
      profile: {
        latitude: 21.3069,
        longitude: -157.8583,
      },
      fitnessProfile: {
        intensityLevel: IntensityLevel.INTERMEDIATE,
        primaryGoal: 'strength',
        secondaryGoal: 'mobility',
      },
    });
    prismaMock.user.findMany.mockResolvedValue([
      makeCandidate({
        id: 'lower-score',
        birthdate: new Date('1990-01-01T00:00:00.000Z'),
        profile: {
          city: 'Honolulu',
          bio: null,
          latitude: 21.45,
          longitude: -157.95,
        },
        fitnessProfile: {
          primaryGoal: 'strength',
          secondaryGoal: 'flexibility',
          intensityLevel: IntensityLevel.BEGINNER,
          prefersMorning: false,
          prefersEvening: false,
          favoriteActivities: null,
        },
      }),
      makeCandidate({
        id: 'higher-score',
        birthdate: new Date('1997-05-01T00:00:00.000Z'),
        profile: {
          city: 'Honolulu',
          bio: 'Close by',
          latitude: 21.307,
          longitude: -157.8584,
        },
        fitnessProfile: {
          primaryGoal: 'strength',
          secondaryGoal: 'mobility',
          intensityLevel: IntensityLevel.INTERMEDIATE,
          prefersMorning: true,
          prefersEvening: false,
          favoriteActivities: null,
        },
      }),
    ]);

    const result = await service.getFeed('me');

    expect(result.map((candidate) => candidate!.id)).toEqual([
      'higher-score',
      'lower-score',
    ]);
    expect(result[0]?.recommendationScore).toBeGreaterThan(
      result[1]?.recommendationScore ?? 0,
    );
    expect(result[0]?.profile).toEqual({
      city: 'Honolulu',
      bio: 'Close by',
      intentDating: true,
      intentWorkout: true,
      intentFriends: false,
    });
    expect(result[1]?.profile).toEqual({
      city: 'Honolulu',
      bio: null,
      intentDating: true,
      intentWorkout: true,
      intentFriends: false,
    });
    expect(result[0]?.profile).not.toHaveProperty('latitude');
    expect(result[0]?.profile).not.toHaveProperty('longitude');
    expect(result[1]?.profile).not.toHaveProperty('latitude');
    expect(result[1]?.profile).not.toHaveProperty('longitude');
  });

  it('limits the feed to women when discovery preference is women only', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'me',
      gender: Gender.MALE,
      showMeMen: false,
      showMeWomen: true,
      profile: {
        latitude: 21.3069,
        longitude: -157.8583,
      },
      fitnessProfile: {
        intensityLevel: IntensityLevel.INTERMEDIATE,
        primaryGoal: 'strength',
        secondaryGoal: 'mobility',
      },
    });
    prismaMock.user.findMany.mockResolvedValue([]);

    await service.getFeed('me');

    const query = prismaMock.user.findMany.mock.calls[0][0];
    expect(query.where.gender).toEqual({
      in: [Gender.FEMALE],
    });
  });

  it('derives mutual match classification from shared intents', async () => {
    prismaMock.like.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'mutual-like' });
    prismaMock.pass.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.like.create.mockResolvedValue({ id: 'like-1' });
    prismaMock.userProfile.findMany.mockResolvedValue([
      {
        userId: 'user-1',
        intentDating: false,
        intentWorkout: true,
      },
      {
        userId: 'user-2',
        intentDating: true,
        intentWorkout: true,
      },
    ]);
    prismaMock.match.upsert.mockResolvedValue({ id: 'match-1' });

    const result = await service.likeUser('user-1', 'user-2');

    expect(prismaMock.match.upsert).toHaveBeenCalledWith({
      where: {
        userAId_userBId: {
          userAId: 'user-1',
          userBId: 'user-2',
        },
      },
      create: {
        userAId: 'user-1',
        userBId: 'user-2',
        isDatingMatch: false,
        isWorkoutMatch: true,
      },
      update: expect.objectContaining({
        updatedAt: expect.any(Date),
        isBlocked: false,
        isArchived: false,
        isDatingMatch: false,
        isWorkoutMatch: true,
      }),
    });
    expect(result).toEqual({ status: 'match', match: { id: 'match-1' } });
  });

  it('returns already_liked status when like exists', async () => {
    prismaMock.like.findUnique.mockResolvedValue({ id: 'existing-like' });

    const result = await service.likeUser('user-1', 'user-2');

    expect(result).toEqual({ status: 'already_liked' });
    expect(prismaMock.like.create).not.toHaveBeenCalled();
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining('"outcome":"already_liked"'),
    );
  });

  it('logs notification failures with structured like context', async () => {
    notificationsMock.create.mockRejectedValueOnce(new Error('push down'));
    prismaMock.like.findUnique.mockResolvedValue(null);
    prismaMock.pass.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.like.create.mockResolvedValue({ id: 'like-1' });
    prismaMock.like.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    await service.likeUser('user-1', 'user-2');
    await new Promise(setImmediate);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('"event":"discovery.notification_failed"'),
      expect.anything(),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('"operation":"like_received"'),
      expect.anything(),
    );
  });

  it('rejects self-like requests', async () => {
    await expect(service.likeUser('user-1', 'user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects liking a missing target user', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    await expect(service.likeUser('user-1', 'missing-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects liking a blocked target user', async () => {
    blockServiceMock.isBlocked.mockResolvedValue(true);

    await expect(service.likeUser('user-1', 'user-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prismaMock.like.create).not.toHaveBeenCalled();
  });

  it('clears an existing pass before creating a like', async () => {
    prismaMock.like.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prismaMock.pass.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.like.create.mockResolvedValue({ id: 'like-1' });

    const result = await service.likeUser('user-1', 'user-2');

    expect(result).toEqual({ status: 'liked' });
    expect(prismaMock.pass.deleteMany).toHaveBeenCalledWith({
      where: { fromUserId: 'user-1', toUserId: 'user-2' },
    });
  });

  it('creates a pass record and clears any existing like', async () => {
    prismaMock.pass.findUnique.mockResolvedValue(null);
    prismaMock.like.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.pass.create.mockResolvedValue({ id: 'pass-1' });

    const result = await service.passUser('user-1', 'user-2');

    expect(result).toEqual({ status: 'passed' });
    expect(prismaMock.like.deleteMany).toHaveBeenCalledWith({
      where: { fromUserId: 'user-1', toUserId: 'user-2' },
    });
    expect(prismaMock.pass.create).toHaveBeenCalledWith({
      data: { fromUserId: 'user-1', toUserId: 'user-2' },
    });
  });

  it('rejects self-pass requests', async () => {
    await expect(service.passUser('user-1', 'user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects passing a missing target user', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    await expect(service.passUser('user-1', 'missing-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects passing a blocked target user', async () => {
    blockServiceMock.isBlocked.mockResolvedValue(true);

    await expect(service.passUser('user-1', 'user-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prismaMock.pass.create).not.toHaveBeenCalled();
  });

  it('returns already_passed status when pass exists', async () => {
    prismaMock.pass.findUnique.mockResolvedValue({ id: 'existing-pass' });

    const result = await service.passUser('user-1', 'user-2');

    expect(result).toEqual({ status: 'already_passed' });
    expect(prismaMock.pass.create).not.toHaveBeenCalled();
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining('"event":"discovery.pass.completed"'),
    );
  });

  it('returns nothing_to_undo when no swipes exist', async () => {
    prismaMock.like.findFirst.mockResolvedValue(null);
    prismaMock.pass.findFirst.mockResolvedValue(null);

    const result = await service.undoLastSwipe('user-1');

    expect(result).toEqual({ status: 'nothing_to_undo' });
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining('"event":"discovery.undo.completed"'),
    );
  });

  it('returns liked status when no mutual like exists', async () => {
    prismaMock.like.findUnique
      .mockResolvedValueOnce(null) // no existing like from user-1 to user-2
      .mockResolvedValueOnce(null); // no mutual like from user-2 to user-1
    prismaMock.pass.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.like.create.mockResolvedValue({ id: 'like-1' });

    const result = await service.likeUser('user-1', 'user-2');

    expect(result).toEqual({ status: 'liked' });
    expect(prismaMock.match.upsert).not.toHaveBeenCalled();
  });

  it('undoes most recent pass swipe', async () => {
    prismaMock.like.findFirst.mockResolvedValue(null);
    prismaMock.pass.findFirst.mockResolvedValue({
      id: 'pass-1',
      toUserId: 'user-2',
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
    });

    const result = await service.undoLastSwipe('user-1');

    expect(prismaMock.pass.delete).toHaveBeenCalledWith({
      where: { id: 'pass-1' },
    });
    expect(result).toEqual({
      status: 'undone',
      action: 'pass',
      targetUserId: 'user-2',
    });
  });

  it('undoes the newer pass when both swipe types exist', async () => {
    prismaMock.like.findFirst.mockResolvedValue({
      id: 'like-1',
      toUserId: 'user-2',
      createdAt: new Date('2026-01-01T09:00:00.000Z'),
    });
    prismaMock.pass.findFirst.mockResolvedValue({
      id: 'pass-1',
      toUserId: 'user-3',
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
    });

    const result = await service.undoLastSwipe('user-1');

    expect(prismaMock.pass.delete).toHaveBeenCalledWith({
      where: { id: 'pass-1' },
    });
    expect(prismaMock.like.delete).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'undone',
      action: 'pass',
      targetUserId: 'user-3',
    });
  });

  it('prefers undoing the like when both swipe types share the same timestamp', async () => {
    const createdAt = new Date('2026-01-01T10:00:00.000Z');
    prismaMock.like.findFirst.mockResolvedValue({
      id: 'like-1',
      toUserId: 'user-2',
      createdAt,
    });
    prismaMock.pass.findFirst.mockResolvedValue({
      id: 'pass-1',
      toUserId: 'user-3',
      createdAt,
    });
    prismaMock.like.delete.mockResolvedValue({ id: 'like-1' });
    prismaMock.match.findUnique.mockResolvedValue(null);

    const result = await service.undoLastSwipe('user-1');

    expect(prismaMock.like.delete).toHaveBeenCalledWith({
      where: { id: 'like-1' },
    });
    expect(prismaMock.pass.delete).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'undone',
      action: 'like',
      targetUserId: 'user-2',
    });
  });

  it('undoes a like and archives the resulting match', async () => {
    prismaMock.like.findFirst.mockResolvedValue({
      id: 'like-1',
      toUserId: 'user-2',
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
    });
    prismaMock.pass.findFirst.mockResolvedValue(null);
    prismaMock.like.delete.mockResolvedValue({ id: 'like-1' });
    prismaMock.match.findUnique.mockResolvedValue({
      id: 'match-1',
      userAId: 'user-1',
      userBId: 'user-2',
      isArchived: false,
    });
    prismaMock.match.update.mockResolvedValue({ id: 'match-1', isArchived: true });

    const result = await service.undoLastSwipe('user-1');

    expect(prismaMock.match.findUnique).toHaveBeenCalledWith({
      where: { userAId_userBId: { userAId: 'user-1', userBId: 'user-2' } },
    });
    expect(prismaMock.match.update).toHaveBeenCalledWith({
      where: { id: 'match-1' },
      data: { isArchived: true },
    });
    expect(result).toEqual({
      status: 'undone',
      action: 'like',
      targetUserId: 'user-2',
      archivedMatchId: 'match-1',
    });
  });

  it('undoes a like without archiving when no match exists', async () => {
    prismaMock.like.findFirst.mockResolvedValue({
      id: 'like-1',
      toUserId: 'user-2',
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
    });
    prismaMock.pass.findFirst.mockResolvedValue(null);
    prismaMock.like.delete.mockResolvedValue({ id: 'like-1' });
    prismaMock.match.findUnique.mockResolvedValue(null);

    const result = await service.undoLastSwipe('user-1');

    expect(prismaMock.match.findUnique).toHaveBeenCalled();
    expect(prismaMock.match.update).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'undone',
      action: 'like',
      targetUserId: 'user-2',
    });
  });

  it('does not re-archive an already archived match when undoing a like', async () => {
    prismaMock.like.findFirst.mockResolvedValue({
      id: 'like-1',
      toUserId: 'user-2',
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
    });
    prismaMock.pass.findFirst.mockResolvedValue(null);
    prismaMock.like.delete.mockResolvedValue({ id: 'like-1' });
    prismaMock.match.findUnique.mockResolvedValue({
      id: 'match-1',
      userAId: 'user-1',
      userBId: 'user-2',
      isArchived: true,
    });

    const result = await service.undoLastSwipe('user-1');

    expect(prismaMock.match.update).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'undone',
      action: 'like',
      targetUserId: 'user-2',
    });
  });

  it('wraps likeUser core logic in a transaction', async () => {
    prismaMock.like.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prismaMock.pass.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.like.create.mockResolvedValue({ id: 'like-1' });

    await service.likeUser('user-1', 'user-2');

    expect(prismaMock.$transaction).toHaveBeenCalledWith(expect.any(Function));
  });

  it('catches notification errors without rejecting', async () => {
    prismaMock.like.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prismaMock.pass.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.like.create.mockResolvedValue({ id: 'like-1' });
    notificationsMock.create.mockRejectedValue(new Error('notification fail'));

    // Should not throw even though notification fails
    const result = await service.likeUser('user-1', 'user-2');
    expect(result).toEqual({ status: 'liked' });
  });

  describe('invalidateUserFeedCache', () => {
    it('deletes all feed keys when store.keys is available', async () => {
      const keysSpy = jest.fn().mockResolvedValue(['feed:user-1:abc', 'feed:user-1:def']);
      const cacheWithStore = {
        get: jest.fn().mockResolvedValue(undefined),
        set: jest.fn().mockResolvedValue(undefined),
        del: jest.fn().mockResolvedValue(undefined),
        store: { keys: keysSpy },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DiscoveryService,
          { provide: PrismaService, useValue: prismaMock },
          { provide: NotificationsService, useValue: notificationsMock },
          { provide: BlockService, useValue: blockServiceMock },
          { provide: CACHE_MANAGER, useValue: cacheWithStore },
        ],
      }).compile();

      const svc = module.get<DiscoveryService>(DiscoveryService);
      await svc.invalidateUserFeedCache('user-1');

      expect(keysSpy).toHaveBeenCalledWith('feed:user-1:*');
      expect(cacheWithStore.del).toHaveBeenCalledWith('blocked:user-1');
      expect(cacheWithStore.del).toHaveBeenCalledWith('feed:user-1:abc');
      expect(cacheWithStore.del).toHaveBeenCalledWith('feed:user-1:def');
    });

    it('falls back to deleting only blocked key and logs a warning when store.keys is unavailable', async () => {
      await service.invalidateUserFeedCache('user-1');

      expect(cacheMock.del).toHaveBeenCalledWith('blocked:user-1');
      expect(cacheMock.del).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('store_keys_unavailable'),
      );
    });
  });

  describe('concurrent operations', () => {
    it('mutual like creates match with lexicographic userAId/userBId ordering', async () => {
      // User B ('user-2') already liked user A ('user-1').
      // Now user A likes user B — should create a mutual match.
      prismaMock.like.findUnique
        .mockResolvedValueOnce(null) // no existing like from user-1 → user-2
        .mockResolvedValueOnce({ id: 'reverse-like' }); // mutual like from user-2 → user-1 exists
      prismaMock.pass.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.like.create.mockResolvedValue({ id: 'like-1' });
      prismaMock.userProfile.findMany.mockResolvedValue([
        { userId: 'user-1', intentDating: true, intentWorkout: true },
        { userId: 'user-2', intentDating: true, intentWorkout: false },
      ]);
      prismaMock.match.upsert.mockResolvedValue({ id: 'match-1' });

      const result = await service.likeUser('user-1', 'user-2');

      expect(result).toEqual({ status: 'match', match: { id: 'match-1' } });
      // Verify lexicographic sort: 'user-1' < 'user-2'
      expect(prismaMock.match.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userAId_userBId: {
              userAId: 'user-1',
              userBId: 'user-2',
            },
          },
          create: expect.objectContaining({
            userAId: 'user-1',
            userBId: 'user-2',
          }),
        }),
      );
    });

    it('mutual like preserves lexicographic order when actor id sorts after target', async () => {
      // user-2 likes user-1 (actor > target alphabetically)
      // user-1 has already liked user-2
      prismaMock.user.findFirst.mockResolvedValue({ id: 'user-1' });
      prismaMock.like.findUnique
        .mockResolvedValueOnce(null) // no existing like from user-2 → user-1
        .mockResolvedValueOnce({ id: 'reverse-like' }); // mutual like from user-1 → user-2
      prismaMock.pass.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.like.create.mockResolvedValue({ id: 'like-2' });
      prismaMock.userProfile.findMany.mockResolvedValue([
        { userId: 'user-1', intentDating: true, intentWorkout: true },
        { userId: 'user-2', intentDating: true, intentWorkout: true },
      ]);
      prismaMock.match.upsert.mockResolvedValue({ id: 'match-2' });

      const result = await service.likeUser('user-2', 'user-1');

      expect(result).toEqual({ status: 'match', match: { id: 'match-2' } });
      // Even though user-2 is the actor, userAId should still be 'user-1' (lexicographic)
      expect(prismaMock.match.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userAId_userBId: {
              userAId: 'user-1',
              userBId: 'user-2',
            },
          },
          create: expect.objectContaining({
            userAId: 'user-1',
            userBId: 'user-2',
          }),
        }),
      );
    });

    it('duplicate like is idempotent', async () => {
      // First like succeeds
      prismaMock.like.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prismaMock.pass.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.like.create.mockResolvedValue({ id: 'like-1' });

      const first = await service.likeUser('user-1', 'user-2');
      expect(first).toEqual({ status: 'liked' });

      // Second like — existing like found
      prismaMock.like.findUnique.mockResolvedValue({ id: 'like-1' });

      const second = await service.likeUser('user-1', 'user-2');
      expect(second).toEqual({ status: 'already_liked' });

      // The create should only have been called once (from the first like)
      expect(prismaMock.like.create).toHaveBeenCalledTimes(1);
    });

    it('like after block is rejected', async () => {
      // user-1 has blocked user-2; user-2 tries to like user-1
      blockServiceMock.isBlocked.mockResolvedValue(true);

      await expect(service.likeUser('user-2', 'user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prismaMock.like.create).not.toHaveBeenCalled();
      expect(prismaMock.match.upsert).not.toHaveBeenCalled();
    });

    it('undo like before mutual match prevents match creation', async () => {
      // Step 1: user-1 likes user-2
      prismaMock.like.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prismaMock.pass.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.like.create.mockResolvedValue({ id: 'like-1' });

      const likeResult = await service.likeUser('user-1', 'user-2');
      expect(likeResult).toEqual({ status: 'liked' });

      // Step 2: user-1 undoes the like
      prismaMock.like.findFirst.mockResolvedValue({
        id: 'like-1',
        toUserId: 'user-2',
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
      });
      prismaMock.pass.findFirst.mockResolvedValue(null);
      prismaMock.like.delete.mockResolvedValue({ id: 'like-1' });
      prismaMock.match.findUnique.mockResolvedValue(null);

      const undoResult = await service.undoLastSwipe('user-1');
      expect(undoResult).toEqual({
        status: 'undone',
        action: 'like',
        targetUserId: 'user-2',
      });

      // Step 3: user-2 now likes user-1 — but user-1's like was undone,
      // so no mutual like exists and no match should be created
      prismaMock.user.findFirst.mockResolvedValue({ id: 'user-1' });
      prismaMock.like.findUnique
        .mockResolvedValueOnce(null) // no existing like from user-2 → user-1
        .mockResolvedValueOnce(null); // no mutual like from user-1 → user-2 (it was undone)
      prismaMock.pass.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.like.create.mockResolvedValue({ id: 'like-2' });

      const secondLikeResult = await service.likeUser('user-2', 'user-1');
      expect(secondLikeResult).toEqual({ status: 'liked' });
      expect(prismaMock.match.upsert).not.toHaveBeenCalled();
    });
  });

});
