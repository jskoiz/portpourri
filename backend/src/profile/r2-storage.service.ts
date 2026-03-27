import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { appConfig } from '../config/app.config';
import type { IPhotoStorage } from './photo-storage.service';
import {
  normalizeProfilePhoto,
  extensionForMimeType,
} from './photo-storage.service';

@Injectable()
export class R2StorageService implements IPhotoStorage {
  private readonly logger = new Logger(R2StorageService.name);
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor() {
    const { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl } =
      appConfig.storage.r2;

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.bucketName = bucketName;
    this.publicUrl = publicUrl;
  }

  async saveProfilePhoto(
    file: Express.Multer.File,
  ): Promise<{ storageKey: string; fileName: string }> {
    const normalizedFile = await normalizeProfilePhoto(file);
    const extension = extensionForMimeType(normalizedFile.mimetype);
    const fileName = `profile/${randomUUID()}.${extension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: normalizedFile.buffer,
        ContentType: normalizedFile.mimetype,
      }),
    );

    // Store just the object key — public URL is constructed at read time
    // This makes R2_PUBLIC_URL changes non-breaking
    const storageKey = `r2://${fileName}`;
    this.logger.log(`Uploaded photo to R2: ${fileName}`);

    return { storageKey, fileName };
  }

  /** Resolve a storageKey to its public URL for serving. */
  resolveUrl(storageKey: string): string {
    if (!storageKey.startsWith('r2://')) return storageKey;
    return `${this.publicUrl}/${storageKey.slice(5)}`;
  }

  async removeProfilePhoto(storageKey?: string | null): Promise<void> {
    if (!storageKey) return;

    // Extract the R2 object key from the storageKey
    let key: string;
    if (storageKey.startsWith('r2://')) {
      key = storageKey.slice(5);
    } else if (storageKey.startsWith(this.publicUrl)) {
      // Legacy full-URL format (backwards compat)
      key = storageKey.replace(`${this.publicUrl}/`, '');
    } else {
      this.logger.warn(
        `Cannot extract R2 key from storageKey: ${storageKey}`,
      );
      return;
    }

    if (!key) return;

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      this.logger.log(`Deleted photo from R2: ${key}`);
    } catch (error) {
      this.logger.warn(
        `Failed to delete photo from R2: ${key} - ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
