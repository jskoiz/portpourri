import { BadRequestException, Injectable } from '@nestjs/common';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { appConfig } from '../config/app.config';

function extensionForMimeType(mimeType: string) {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'bin';
  }
}

function profilePhotoFileNameFromStorageKey(storageKey: string) {
  const prefix = `${appConfig.uploads.profilePublicBaseUrl}/`;
  if (!storageKey.startsWith(prefix)) {
    throw new BadRequestException('Invalid profile photo storage key');
  }

  const encodedFileName = storageKey.slice(prefix.length);
  if (
    !encodedFileName ||
    encodedFileName.includes('/') ||
    encodedFileName.includes('\\')
  ) {
    throw new BadRequestException('Invalid profile photo storage key');
  }

  let fileName: string;
  try {
    fileName = decodeURIComponent(encodedFileName);
  } catch {
    throw new BadRequestException('Invalid profile photo storage key');
  }

  if (
    !fileName ||
    fileName === '.' ||
    fileName === '..' ||
    fileName.includes('/') ||
    fileName.includes('\\') ||
    fileName.includes('..') ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(fileName)
  ) {
    throw new BadRequestException('Invalid profile photo storage key');
  }

  return fileName;
}

@Injectable()
export class PhotoStorageService {
  async saveProfilePhoto(file: Express.Multer.File) {
    const extension = extensionForMimeType(file.mimetype);
    const fileName = `${randomUUID()}.${extension}`;
    const absoluteDir = join(process.cwd(), appConfig.uploads.profileDir);
    const absolutePath = join(absoluteDir, fileName);

    await mkdir(absoluteDir, { recursive: true });
    await writeFile(absolutePath, file.buffer);

    return {
      storageKey: `${appConfig.uploads.profilePublicBaseUrl}/${fileName}`,
      fileName,
    };
  }

  async removeProfilePhoto(storageKey?: string | null) {
    if (!storageKey) return;

    const fileName = profilePhotoFileNameFromStorageKey(storageKey);
    const absolutePath = join(
      process.cwd(),
      appConfig.uploads.profileDir,
      fileName,
    );
    await rm(absolutePath, { force: true });
  }
}
