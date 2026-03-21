import { BadRequestException } from '@nestjs/common';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { PhotoStorageService } from './photo-storage.service';
import { appConfig } from '../config/app.config';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  rm: jest.fn(),
  writeFile: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}));

describe('PhotoStorageService', () => {
  let service: PhotoStorageService;

  const mkdirMock = jest.mocked(mkdir);
  const rmMock = jest.mocked(rm);
  const writeFileMock = jest.mocked(writeFile);
  const randomUUIDMock = jest.mocked(randomUUID);

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PhotoStorageService();
    randomUUIDMock.mockReturnValue('11111111-1111-1111-1111-111111111111');
  });

  it('generates a profile upload path and persists the file', async () => {
    const file = {
      mimetype: 'image/png',
      buffer: Buffer.from('image-bytes'),
    } as Express.Multer.File;

    const result = await service.saveProfilePhoto(file);

    expect(mkdirMock).toHaveBeenCalledWith(
      join(process.cwd(), appConfig.uploads.profileDir),
      { recursive: true },
    );
    expect(writeFileMock).toHaveBeenCalledWith(
      join(
        process.cwd(),
        appConfig.uploads.profileDir,
        '11111111-1111-1111-1111-111111111111.png',
      ),
      file.buffer,
    );
    expect(result).toEqual({
      storageKey: `${appConfig.uploads.profilePublicBaseUrl}/11111111-1111-1111-1111-111111111111.png`,
      fileName: '11111111-1111-1111-1111-111111111111.png',
    });
  });

  it.each([
    ['image/heic', 'heic'],
    ['image/heif', 'heif'],
  ])(
    'preserves the correct extension for %s uploads',
    async (mimetype, extension) => {
      const file = {
        mimetype,
        buffer: Buffer.from('image-bytes'),
      } as Express.Multer.File;

      const result = await service.saveProfilePhoto(file);

      expect(writeFileMock).toHaveBeenCalledWith(
        join(
          process.cwd(),
          appConfig.uploads.profileDir,
          `11111111-1111-1111-1111-111111111111.${extension}`,
        ),
        file.buffer,
      );
      expect(result).toEqual({
        storageKey: `${appConfig.uploads.profilePublicBaseUrl}/11111111-1111-1111-1111-111111111111.${extension}`,
        fileName: `11111111-1111-1111-1111-111111111111.${extension}`,
      });
    },
  );

  it('deletes a valid profile photo path', async () => {
    await service.removeProfilePhoto(
      `${appConfig.uploads.profilePublicBaseUrl}/11111111-1111-1111-1111-111111111111.webp`,
    );

    expect(rmMock).toHaveBeenCalledWith(
      join(
        process.cwd(),
        appConfig.uploads.profileDir,
        '11111111-1111-1111-1111-111111111111.webp',
      ),
      { force: true },
    );
  });

  it('rejects traversal-style storage keys before deleting', async () => {
    await expect(
      service.removeProfilePhoto(
        `${appConfig.uploads.profilePublicBaseUrl}/../../escape.txt`,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(rmMock).not.toHaveBeenCalled();
  });

  it('propagates write failures from saveProfilePhoto', async () => {
    const error = new Error('disk full');
    writeFileMock.mockRejectedValue(error);

    await expect(
      service.saveProfilePhoto({
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image-bytes'),
      } as Express.Multer.File),
    ).rejects.toThrow(error);
  });

  it('propagates rm failures for valid storage keys', async () => {
    const error = new Error('permission denied');
    rmMock.mockRejectedValue(error);

    await expect(
      service.removeProfilePhoto(
        `${appConfig.uploads.profilePublicBaseUrl}/11111111-1111-1111-1111-111111111111.jpg`,
      ),
    ).rejects.toThrow(error);
  });
});
