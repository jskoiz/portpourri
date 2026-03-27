import { BadRequestException, Injectable } from '@nestjs/common';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import heicConvert from 'heic-convert';
import { appConfig } from '../config/app.config';

export interface IPhotoStorage {
  saveProfilePhoto(
    file: Express.Multer.File,
  ): Promise<{ storageKey: string; fileName: string }>;
  removeProfilePhoto(storageKey?: string | null): Promise<void>;
  /** Resolve a storageKey to a servable URL. Default: identity (key is already a URL). */
  resolveUrl?(storageKey: string): string;
}

const HEIC_MIME_TYPES = new Set(['image/heic', 'image/heif']);

export function extensionForMimeType(mimeType: string) {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
      return 'heic';
    case 'image/heif':
      return 'heif';
    default:
      return 'bin';
  }
}

export async function normalizeProfilePhoto(file: Express.Multer.File) {
  if (!HEIC_MIME_TYPES.has(file.mimetype)) {
    return file;
  }

  try {
    const convertedBuffer = await heicConvert({
      buffer: file.buffer,
      format: 'JPEG',
      quality: 0.92,
    });

    return {
      ...file,
      buffer: Buffer.from(convertedBuffer),
      mimetype: 'image/jpeg',
      size: Buffer.byteLength(convertedBuffer),
    };
  } catch {
    throw new BadRequestException('Unable to process HEIC/HEIF photo');
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
export class PhotoStorageService implements IPhotoStorage {
  async saveProfilePhoto(file: Express.Multer.File) {
    const normalizedFile = await normalizeProfilePhoto(file);
    const extension = extensionForMimeType(normalizedFile.mimetype);
    const fileName = `${randomUUID()}.${extension}`;
    const absoluteDir = join(process.cwd(), appConfig.uploads.profileDir);
    const absolutePath = join(absoluteDir, fileName);

    await mkdir(absoluteDir, { recursive: true });
    await writeFile(absolutePath, normalizedFile.buffer);

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
