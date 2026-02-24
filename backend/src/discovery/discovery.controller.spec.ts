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
});
