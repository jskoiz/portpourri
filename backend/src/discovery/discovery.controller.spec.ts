import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';

describe('DiscoveryController', () => {
  let controller: DiscoveryController;

  const discoveryServiceMock = {
    getFeed: jest.fn(),
    likeUser: jest.fn(),
    passUser: jest.fn(),
    undoLastSwipe: jest.fn(),
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
      ],
    }).compile();

    controller = module.get<DiscoveryController>(DiscoveryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('parses feed filters from query params and forwards them to the service', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    discoveryServiceMock.getFeed.mockResolvedValue([]);

    await expect(
      controller.getFeed(req, {
        distanceKm: '10',
        minAge: '25',
        maxAge: '32',
        goals: 'strength,endurance',
        intensity: 'moderate',
        availability: 'morning,evening,invalid',
      }),
    ).resolves.toEqual([]);

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

    await expect(
      controller.getFeed(req, {
        distanceKm: ['abc', '15'],
        minAge: [' ', '24'],
        maxAge: ['41'],
        goals: ['strength,endurance', '', 'mobility'],
        intensity: ['moderate', 'high'],
        availability: ['morning,invalid', 'evening'],
      }),
    ).resolves.toEqual([]);

    expect(discoveryServiceMock.getFeed).toHaveBeenCalledWith('user-1', {
      distanceKm: 15,
      minAge: 24,
      maxAge: 41,
      goals: ['strength', 'endurance', 'mobility'],
      intensity: ['moderate', 'high'],
      availability: ['morning', 'evening'],
    });
  });

  it('delegates like action to discovery service', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    discoveryServiceMock.likeUser.mockResolvedValue({ status: 'liked' });

    await expect(controller.likeUser(req, 'user-2')).resolves.toEqual({
      status: 'liked',
    });
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

    await expect(controller.undoLastSwipe(req)).resolves.toEqual({
      status: 'undone',
      action: 'pass',
      targetUserId: 'user-2',
    });
    expect(discoveryServiceMock.undoLastSwipe).toHaveBeenCalledWith('user-1');
  });

  it('delegates profile completeness lookup to discovery service', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    discoveryServiceMock.getProfileCompleteness.mockResolvedValue({
      score: 75,
      prompts: ['Upload at least 2 profile photos.'],
    });

    await expect(controller.getProfileCompleteness(req)).resolves.toEqual({
      score: 75,
      prompts: ['Upload at least 2 profile photos.'],
    });
    expect(discoveryServiceMock.getProfileCompleteness).toHaveBeenCalledWith(
      'user-1',
    );
  });
});
