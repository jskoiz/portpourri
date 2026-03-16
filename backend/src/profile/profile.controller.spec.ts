import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';

describe('ProfileController', () => {
  let controller: ProfileController;

  const profileServiceMock = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    updateFitnessProfile: jest.fn(),
    uploadPhoto: jest.fn(),
    updatePhoto: jest.fn(),
    deletePhoto: jest.fn(),
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
    const req = { user: { id: 'user-1' } } as AuthenticatedRequest;
    const dto = { intensityLevel: 'ADVANCED' as const };

    profileServiceMock.updateFitnessProfile.mockResolvedValue({
      userId: 'user-1',
      ...dto,
    });

    await expect(
      controller.updateFitnessProfile(req, { userId: 'user-1', ...dto }),
    ).resolves.toEqual({ userId: 'user-1', ...dto });
    expect(profileServiceMock.updateFitnessProfile).toHaveBeenCalledWith(
      'user-1',
      { userId: 'user-1', ...dto },
    );
  });

  it('delegates updateProfile to profile service', async () => {
    const req = { user: { id: 'user-1' } } as AuthenticatedRequest;
    const dto = { bio: 'I like running' };

    profileServiceMock.updateProfile.mockResolvedValue({
      userId: 'user-1',
      ...dto,
    });

    await expect(controller.updateProfile(req, dto)).resolves.toEqual({
      userId: 'user-1',
      ...dto,
    });
    expect(profileServiceMock.updateProfile).toHaveBeenCalledWith('user-1', dto);
  });

  it('delegates uploadPhoto to profile service', async () => {
    const req = { user: { id: 'user-1' } } as AuthenticatedRequest;
    const file = { mimetype: 'image/jpeg', buffer: Buffer.from('img') } as Express.Multer.File;

    profileServiceMock.uploadPhoto.mockResolvedValue({ id: 'photo-1' });

    await expect(controller.uploadPhoto(req, file)).resolves.toEqual({ id: 'photo-1' });
    expect(profileServiceMock.uploadPhoto).toHaveBeenCalledWith('user-1', file);
  });

  it('delegates updatePhoto to profile service', async () => {
    const req = { user: { id: 'user-1' } } as AuthenticatedRequest;
    const dto = { isPrimary: true };

    profileServiceMock.updatePhoto.mockResolvedValue({ id: 'photo-1', isPrimary: true });

    await expect(controller.updatePhoto(req, 'photo-1', dto)).resolves.toEqual({
      id: 'photo-1',
      isPrimary: true,
    });
    expect(profileServiceMock.updatePhoto).toHaveBeenCalledWith('user-1', 'photo-1', dto);
  });

  it('delegates deletePhoto to profile service', async () => {
    const req = { user: { id: 'user-1' } } as AuthenticatedRequest;

    profileServiceMock.deletePhoto.mockResolvedValue({ id: 'photo-1', isHidden: true });

    await expect(controller.deletePhoto(req, 'photo-1')).resolves.toEqual({
      id: 'photo-1',
      isHidden: true,
    });
    expect(profileServiceMock.deletePhoto).toHaveBeenCalledWith('user-1', 'photo-1');
  });
});
