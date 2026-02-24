import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProfileService', () => {
  let service: ProfileService;

  const prismaMock = {
    userFitnessProfile: {
      upsert: jest.fn(),
    },
    userProfile: {
      upsert: jest.fn(),
    },
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
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
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('marks user as onboarded when fitness profile is updated', async () => {
    const profile = { userId: 'user-1', intensityLevel: 'high' };
    prismaMock.userFitnessProfile.upsert.mockResolvedValue(profile);

    const result = await service.updateFitnessProfile('user-1', { intensityLevel: 'high' });

    expect(result).toEqual(profile);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isOnboarded: true },
    });
  });
});
