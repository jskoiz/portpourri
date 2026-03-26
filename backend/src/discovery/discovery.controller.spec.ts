import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  DiscoveryFeedSchema,
  LikeResponseSchema,
  PassResponseSchema,
  ProfileCompletenessSchema,
  UndoSwipeResponseSchema,
} from '@contracts';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';
import { ProfileService } from '../profile/profile.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';

function expectSchema<T>(schema: { parse: (value: unknown) => T }, value: unknown) {
  expect(() => schema.parse(value)).not.toThrow();
}

describe('DiscoveryController', () => {
  let controller: DiscoveryController;

  const discoveryServiceMock = {
    getFeed: jest.fn(),
    likeUser: jest.fn(),
    passUser: jest.fn(),
    undoLastSwipe: jest.fn(),
  };

  const profileServiceMock = {
    getProfileCompleteness: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiscoveryController],
      providers: [
        {
          provide: DiscoveryService,
          useValue: discoveryServiceMock,
        },
        {
          provide: ProfileService,
          useValue: profileServiceMock,
        },
      ],
    }).compile();

    controller = module.get<DiscoveryController>(DiscoveryController);
  });

  it('parses feed filters from query params and forwards them to the service', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    discoveryServiceMock.getFeed.mockResolvedValue([]);

    const result = await controller.getFeed(req, {
      distanceKm: '10',
      minAge: '25',
      maxAge: '32',
      goals: 'strength,endurance',
      intensity: 'moderate',
      availability: 'morning,evening,invalid',
    });

    expect(result).toEqual([]);
    expectSchema(DiscoveryFeedSchema, result);

    expect(discoveryServiceMock.getFeed).toHaveBeenCalledWith('user-1', {
      distanceKm: 10,
      minAge: 25,
      maxAge: 32,
      goals: ['strength', 'endurance'],
      intensity: ['moderate'],
      availability: ['morning', 'evening'],
    });
  });

  it('supports repeated query params and drops invalid scalar values', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    discoveryServiceMock.getFeed.mockResolvedValue([]);

    const result = await controller.getFeed(req, {
      distanceKm: '15',
      minAge: '24',
      maxAge: '41',
      goals: 'strength,endurance,mobility',
      intensity: 'moderate,high',
      availability: 'morning,evening',
    });

    expect(result).toEqual([]);
    expectSchema(DiscoveryFeedSchema, result);

    expect(discoveryServiceMock.getFeed).toHaveBeenCalledWith('user-1', {
      distanceKm: 15,
      minAge: 24,
      maxAge: 41,
      goals: ['strength', 'endurance', 'mobility'],
      intensity: ['moderate', 'high'],
      availability: ['morning', 'evening'],
    });
  });

  it('rejects contradictory age ranges', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;

    await expect(
      controller.getFeed(req, {
        minAge: '40',
        maxAge: '25',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(discoveryServiceMock.getFeed).not.toHaveBeenCalled();
  });

  it('delegates like action to discovery service', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    discoveryServiceMock.likeUser.mockResolvedValue({ status: 'liked' });

    const result = await controller.likeUser(req, 'user-2');

    expect(result).toEqual({
      status: 'liked',
    });
    expectSchema(LikeResponseSchema, result);
    expect(discoveryServiceMock.likeUser).toHaveBeenCalledWith(
      'user-1',
      'user-2',
    );
  });

  it('delegates undo swipe action to discovery service', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    discoveryServiceMock.undoLastSwipe.mockResolvedValue({
      status: 'undone',
      action: 'pass',
      targetUserId: 'user-2',
    });

    const result = await controller.undoLastSwipe(req);

    expect(result).toEqual({
      status: 'undone',
      action: 'pass',
      targetUserId: 'user-2',
    });
    expectSchema(UndoSwipeResponseSchema, result);
    expect(discoveryServiceMock.undoLastSwipe).toHaveBeenCalledWith('user-1');
  });

  it('delegates pass action to discovery service', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    discoveryServiceMock.passUser.mockResolvedValue({ status: 'passed' });

    const result = await controller.passUser(req, 'user-2');

    expect(result).toEqual({
      status: 'passed',
    });
    expectSchema(PassResponseSchema, result);
    expect(discoveryServiceMock.passUser).toHaveBeenCalledWith(
      'user-1',
      'user-2',
    );
  });

  it('propagates service errors from like action', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    discoveryServiceMock.likeUser.mockRejectedValue(new Error('DB error'));

    await expect(controller.likeUser(req, 'user-2')).rejects.toThrow(
      'DB error',
    );
  });

  it('delegates profile completeness lookup to profile service', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    profileServiceMock.getProfileCompleteness.mockResolvedValue({
      score: 75,
      total: 8,
      earned: 6,
      prompts: ['Upload at least 2 profile photos.'],
      missing: [
        {
          field: 'photos',
          label: 'Add more photos',
          route: 'EditPhotos',
        },
      ],
    });

    const result = await controller.getProfileCompleteness(req);

    expect(result).toEqual({
      score: 75,
      total: 8,
      earned: 6,
      prompts: ['Upload at least 2 profile photos.'],
      missing: [
        {
          field: 'photos',
          label: 'Add more photos',
          route: 'EditPhotos',
        },
      ],
    });
    expectSchema(ProfileCompletenessSchema, result);
    expect(profileServiceMock.getProfileCompleteness).toHaveBeenCalledWith(
      'user-1',
    );
  });
});
