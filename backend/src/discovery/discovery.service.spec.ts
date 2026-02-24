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
    match: {
      upsert: jest.fn(),
    },
  };

  const notificationsMock = {
    create: jest.fn(),
  };

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
