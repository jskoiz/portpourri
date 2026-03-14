/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryService } from './discovery.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('DiscoveryService', () => {
  let service: DiscoveryService;

  const prismaMock = {
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
    },
    userProfile: {
      findMany: jest.fn(),
    },
    match: {
      upsert: jest.fn(),
    },
  };

  const notificationsMock = {
    create: jest.fn(),
  };

  const makeCandidate = (overrides: Record<string, unknown> = {}) => ({
    id: 'candidate-1',
    firstName: 'Casey',
    birthdate: new Date('1998-06-15T00:00:00.000Z'),
    profile: {
      city: 'Honolulu',
      bio: 'Runner and lifter who likes sunrise sessions.',
      latitude: 21.3069,
      longitude: -157.8583,
    },
    fitnessProfile: {
      primaryGoal: 'strength',
      secondaryGoal: 'endurance',
      intensityLevel: 'moderate',
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
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

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
      ],
    }).compile();

    service = module.get<DiscoveryService>(DiscoveryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('pushes like/pass exclusions and profile filters into the feed query', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'me',
      profile: {
        latitude: 21.3,
        longitude: -157.8,
      },
      fitnessProfile: {
        intensityLevel: 'moderate',
        primaryGoal: 'strength',
        secondaryGoal: 'endurance',
      },
    });
    prismaMock.user.findMany.mockResolvedValue([makeCandidate()]);

    await service.getFeed('me', {
      minAge: 25,
      maxAge: 32,
      goals: ['Strength'],
      intensity: ['Moderate'],
      availability: ['morning', 'evening'],
    });

    expect(prismaMock.like.findMany).not.toHaveBeenCalled();
    expect(prismaMock.pass.findMany).not.toHaveBeenCalled();
    expect(prismaMock.user.findMany).toHaveBeenCalledTimes(1);

    const query = prismaMock.user.findMany.mock.calls[0][0];
    expect(query.where.id).toEqual({ not: 'me' });
    expect(query.where.receivedLikes).toEqual({ none: { fromUserId: 'me' } });
    expect(query.where.receivedPasses).toEqual({ none: { fromUserId: 'me' } });
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
              in: ['moderate'],
              mode: 'insensitive',
            },
          },
          {
            OR: [{ prefersMorning: true }, { prefersEvening: true }],
          },
        ],
      },
    });
  });

  it('still filters distance after the database query and returns top scored results', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'me',
      profile: {
        latitude: 21.3069,
        longitude: -157.8583,
      },
      fitnessProfile: {
        intensityLevel: 'moderate',
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
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'nearby-match',
        distanceKm: expect.any(Number),
        recommendationScore: expect.any(Number),
      }),
    );
  });

  it('excludes candidates with unknown coordinates when distance filtering is enabled', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'me',
      profile: {
        latitude: 21.3069,
        longitude: -157.8583,
      },
      fitnessProfile: {
        intensityLevel: 'moderate',
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
      profile: {
        latitude: null,
        longitude: null,
      },
      fitnessProfile: {
        intensityLevel: 'moderate',
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
});
