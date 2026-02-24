import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

describe('ProfileController', () => {
  let controller: ProfileController;

  const profileServiceMock = {
    getProfile: jest.fn(),
    updateFitnessProfile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: profileServiceMock,
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates updateFitnessProfile to profile service', async () => {
    const req = { user: { id: 'user-1' } } as any;
    const dto = { intensityLevel: 'high' };

    profileServiceMock.updateFitnessProfile.mockResolvedValue({ userId: 'user-1', ...dto });

    await expect(controller.updateFitnessProfile(req, dto)).resolves.toEqual({ userId: 'user-1', ...dto });
    expect(profileServiceMock.updateFitnessProfile).toHaveBeenCalledWith('user-1', dto);
  });
});
