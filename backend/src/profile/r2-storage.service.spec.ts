import { randomUUID } from 'crypto';
import { R2StorageService } from './r2-storage.service';

const sendMock = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: sendMock })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ ...input, _type: 'PutObject' })),
  DeleteObjectCommand: jest.fn().mockImplementation((input) => ({ ...input, _type: 'DeleteObject' })),
}));

jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}));

jest.mock('heic-convert', () => jest.fn());

jest.mock('../config/app.config', () => ({
  appConfig: {
    storage: {
      provider: 'r2',
      r2: {
        accountId: 'test-account',
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        bucketName: 'test-bucket',
        publicUrl: 'https://photos.example.com',
      },
    },
  },
}));

describe('R2StorageService', () => {
  let service: R2StorageService;
  const randomUUIDMock = jest.mocked(randomUUID);

  beforeEach(() => {
    jest.clearAllMocks();
    service = new R2StorageService();
  });

  describe('saveProfilePhoto', () => {
    it('should upload a file to R2 and return the storageKey', async () => {
      randomUUIDMock.mockReturnValue('test-uuid-1234' as ReturnType<typeof randomUUID>);
      sendMock.mockResolvedValue({});

      const file = {
        buffer: Buffer.from('fake-image'),
        mimetype: 'image/jpeg',
        originalname: 'photo.jpg',
        size: 10,
      } as Express.Multer.File;

      const result = await service.saveProfilePhoto(file);

      expect(result.storageKey).toBe(
        'r2://profile/test-uuid-1234.jpg',
      );
      expect(result.fileName).toBe('profile/test-uuid-1234.jpg');
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: 'profile/test-uuid-1234.jpg',
          Body: file.buffer,
          ContentType: 'image/jpeg',
        }),
      );
    });

    it('should upload a PNG file with correct extension', async () => {
      randomUUIDMock.mockReturnValue('png-uuid' as ReturnType<typeof randomUUID>);
      sendMock.mockResolvedValue({});

      const file = {
        buffer: Buffer.from('fake-png'),
        mimetype: 'image/png',
        originalname: 'photo.png',
        size: 10,
      } as Express.Multer.File;

      const result = await service.saveProfilePhoto(file);

      expect(result.storageKey).toBe(
        'r2://profile/png-uuid.png',
      );
      expect(result.fileName).toBe('profile/png-uuid.png');
    });
  });

  describe('removeProfilePhoto', () => {
    it('should send a DeleteObjectCommand for a valid storageKey', async () => {
      sendMock.mockResolvedValue({});

      await service.removeProfilePhoto(
        'https://photos.example.com/profile/some-uuid.jpg',
      );

      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: 'profile/some-uuid.jpg',
        }),
      );
    });

    it('should do nothing when storageKey is null', async () => {
      await service.removeProfilePhoto(null);
      expect(sendMock).not.toHaveBeenCalled();
    });

    it('should do nothing when storageKey is undefined', async () => {
      await service.removeProfilePhoto(undefined);
      expect(sendMock).not.toHaveBeenCalled();
    });

    it('should warn and skip when storageKey does not match publicUrl', async () => {
      await service.removeProfilePhoto('https://other-domain.com/photo.jpg');
      expect(sendMock).not.toHaveBeenCalled();
    });

    it('should not throw when S3 delete fails', async () => {
      sendMock.mockRejectedValue(new Error('S3 error'));

      await expect(
        service.removeProfilePhoto(
          'https://photos.example.com/profile/fail-uuid.jpg',
        ),
      ).resolves.toBeUndefined();
    });
  });
});
