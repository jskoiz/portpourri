import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CurrentUserSchema } from '@contracts';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';
import { expectSchema } from '../../test-support/expect-schema';

describe('ProfileController', () => {
  let controller: ProfileController;

  const profileServiceMock = {
    getProfile: jest.fn(),
    getPublicProfile: jest.fn(),
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

  it('delegates updateFitnessProfile to profile service', async () => {
    const req = { user: { id: 'user-1' } } as AuthenticatedRequest;
    const dto = { intensityLevel: 'ADVANCED' as const };
    const currentUser = {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Jordan',
      birthdate: null,
      gender: 'MALE',
      pronouns: null,
      isOnboarded: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-06-01T00:00:00.000Z'),
      age: 30,
      profile: null,
      fitnessProfile: {
        intensityLevel: 'ADVANCED',
      },
      photos: [],
    };

    profileServiceMock.updateFitnessProfile.mockResolvedValue(currentUser);

    await expect(controller.updateFitnessProfile(req, dto)).resolves.toEqual(
      currentUser,
    );
    expectSchema(CurrentUserSchema, currentUser);
    expect(profileServiceMock.updateFitnessProfile).toHaveBeenCalledWith(
      'user-1',
      dto,
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
    expect(profileServiceMock.updateProfile).toHaveBeenCalledWith(
      'user-1',
      dto,
    );
  });

  it('delegates uploadPhoto to profile service', async () => {
    const req = { user: { id: 'user-1' } } as AuthenticatedRequest;
    const file = {
      mimetype: 'image/jpeg',
      buffer: Buffer.from('img'),
    } as Express.Multer.File;

    profileServiceMock.uploadPhoto.mockResolvedValue({ id: 'photo-1' });

    await expect(controller.uploadPhoto(req, file)).resolves.toEqual({
      id: 'photo-1',
    });
    expect(profileServiceMock.uploadPhoto).toHaveBeenCalledWith('user-1', file);
  });

  it.each(['image/heic', 'image/heif'])(
    'accepts %s uploads from the mobile photo library',
    async (mimetype) => {
      const req = { user: { id: 'user-1' } } as AuthenticatedRequest;
      const file = {
        mimetype,
        buffer: Buffer.from('img'),
      } as Express.Multer.File;

      profileServiceMock.uploadPhoto.mockResolvedValue({ id: 'photo-1' });

      await expect(controller.uploadPhoto(req, file)).resolves.toEqual({
        id: 'photo-1',
      });
      expect(profileServiceMock.uploadPhoto).toHaveBeenCalledWith(
        'user-1',
        file,
      );
    },
  );

  it('delegates updatePhoto to profile service', async () => {
    const req = { user: { id: 'user-1' } } as AuthenticatedRequest;
    const dto = { isPrimary: true };

    profileServiceMock.updatePhoto.mockResolvedValue({
      id: 'photo-1',
      isPrimary: true,
    });

    await expect(controller.updatePhoto(req, 'photo-1', dto)).resolves.toEqual({
      id: 'photo-1',
      isPrimary: true,
    });
    expect(profileServiceMock.updatePhoto).toHaveBeenCalledWith(
      'user-1',
      'photo-1',
      dto,
    );
  });

  it('delegates getProfile to profile service', async () => {
    const req = { user: { id: 'user-1' } } as AuthenticatedRequest;
    const currentUser = {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Jordan',
      birthdate: null,
      gender: 'MALE',
      pronouns: null,
      isOnboarded: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-06-01T00:00:00.000Z'),
      age: 30,
      profile: null,
      fitnessProfile: null,
      photos: [],
    };

    profileServiceMock.getProfile.mockResolvedValue(currentUser);

    await expect(controller.getProfile(req)).resolves.toEqual(currentUser);
    expectSchema(CurrentUserSchema, currentUser);
    expect(profileServiceMock.getProfile).toHaveBeenCalledWith('user-1');
  });

  it('throws NotFoundException when getProfile rejects', async () => {
    const req = { user: { id: 'missing' } } as AuthenticatedRequest;

    profileServiceMock.getProfile.mockRejectedValue(
      new NotFoundException('Profile not found'),
    );

    await expect(controller.getProfile(req)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws BadRequestException when uploading without a file', async () => {
    const req = { user: { id: 'user-1' } } as AuthenticatedRequest;

    await expect(controller.uploadPhoto(req, undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws BadRequestException when uploading unsupported mime type', async () => {
    const req = { user: { id: 'user-1' } } as AuthenticatedRequest;
    const file = {
      mimetype: 'application/pdf',
      buffer: Buffer.from('pdf'),
    } as Express.Multer.File;

    await expect(controller.uploadPhoto(req, file)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('delegates getProfileById to profile service', async () => {
    const req = { user: { id: 'user-1' } } as AuthenticatedRequest;
    profileServiceMock.getPublicProfile.mockResolvedValue({
      id: 'user-2',
      firstName: 'Other',
    });

    await expect(controller.getProfileById(req, 'user-2')).resolves.toEqual({
      id: 'user-2',
      firstName: 'Other',
    });
    expect(profileServiceMock.getPublicProfile).toHaveBeenCalledWith(
      'user-2',
      'user-1',
    );
  });

  it('throws NotFoundException when getProfileById returns null', async () => {
    const req = { user: { id: 'user-1' } } as AuthenticatedRequest;
    profileServiceMock.getPublicProfile.mockResolvedValue(null);

    await expect(controller.getProfileById(req, 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('delegates deletePhoto to profile service', async () => {
    const req = { user: { id: 'user-1' } } as AuthenticatedRequest;

    profileServiceMock.deletePhoto.mockResolvedValue({
      id: 'photo-1',
      isHidden: true,
    });

    await expect(controller.deletePhoto(req, 'photo-1')).resolves.toEqual({
      id: 'photo-1',
      isHidden: true,
    });
    expect(profileServiceMock.deletePhoto).toHaveBeenCalledWith(
      'user-1',
      'photo-1',
    );
  });
});
