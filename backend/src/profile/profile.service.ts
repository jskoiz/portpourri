import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateAge } from '../common/age.util';
import { PhotoStorageService } from './photo-storage.service';
import {
  PROFILE_COMPLETENESS_BIO_MIN_CHARS,
  PROFILE_COMPLETENESS_PHOTO_MIN_COUNT,
  PROFILE_COMPLETENESS_PROMPTS,
} from '../discovery/discovery.constants';
import type {
  UpdateFitnessProfileDto,
  UpdatePhotoDto,
  UpdateProfileDto,
} from './profile.dto';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly photoStorage: PhotoStorageService,
  ) {}

  async updateFitnessProfile(userId: string, data: UpdateFitnessProfileDto) {
    await this.prisma.$transaction(async (tx) => {
      await tx.userFitnessProfile.upsert({
        where: { userId },
        update: {
          ...data,
        },
        create: {
          userId,
          ...data,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { isOnboarded: true },
      });
    });

    // Re-fetch and return the full user profile so callers get a consistent shape
    return this.getProfile(userId);
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    return await this.prisma.userProfile.upsert({
      where: { userId },
      update: { ...data },
      create: { userId, ...data },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isDeleted: false, isBanned: false },
      include: {
        fitnessProfile: true,
        profile: true,
        photos: {
          where: { isHidden: false },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            storageKey: true,
            isPrimary: true,
            sortOrder: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      this.logger.warn(`Profile not found for userId=${userId}`);
      throw new NotFoundException('Profile not found');
    }

    // Strip sensitive auth fields before returning — passwordHash must never
    // leave the service layer (affects both own-profile and getProfileById).
    const {
      passwordHash: _ph,
      providerId: _pid,
      authProvider: _ap,
      ...safeUser
    } = user;

    return {
      ...safeUser,
      age: calculateAge(user.birthdate),
    };
  }

  async uploadPhoto(userId: string, file: Express.Multer.File) {
    const uploaded = await this.photoStorage.saveProfilePhoto(file);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const currentPhotos = await tx.userPhoto.findMany({
          where: { userId },
          orderBy: { sortOrder: 'asc' },
        });

        const nextSortOrder = currentPhotos.length
          ? Math.max(...currentPhotos.map((photo) => photo.sortOrder)) + 1
          : 0;
        const shouldBePrimary = currentPhotos.every((photo) => photo.isHidden);

        if (shouldBePrimary) {
          await tx.userPhoto.updateMany({
            where: { userId },
            data: { isPrimary: false },
          });
        }

        return tx.userPhoto.create({
          data: {
            userId,
            storageKey: uploaded.storageKey,
            sortOrder: nextSortOrder,
            isPrimary: shouldBePrimary,
          },
        });
      });
    } catch (error) {
      await this.photoStorage.removeProfilePhoto(uploaded.storageKey);
      throw error;
    }
  }

  async updatePhoto(userId: string, photoId: string, data: UpdatePhotoDto) {
    const existingPhoto = await this.prisma.userPhoto.findFirst({
      where: { id: photoId, userId },
    });

    if (!existingPhoto) {
      throw new NotFoundException('Photo not found');
    }

    return this.prisma.$transaction(async (tx) => {
      if (data.isPrimary) {
        await tx.userPhoto.updateMany({
          where: { userId },
          data: { isPrimary: false },
        });
      }

      const updated = await tx.userPhoto.update({
        where: { id: photoId },
        data: {
          ...(data.isPrimary !== undefined
            ? { isPrimary: data.isPrimary }
            : {}),
          ...(data.isHidden !== undefined ? { isHidden: data.isHidden } : {}),
          ...(typeof data.sortOrder === 'number'
            ? { sortOrder: data.sortOrder }
            : {}),
        },
      });

      if (updated.isHidden && updated.isPrimary) {
        const fallback = await tx.userPhoto.findFirst({
          where: { userId, id: { not: photoId }, isHidden: false },
          orderBy: { sortOrder: 'asc' },
        });

        if (fallback) {
          await tx.userPhoto.update({
            where: { id: fallback.id },
            data: { isPrimary: true },
          });
        }
      }

      return updated;
    });
  }

  async deletePhoto(userId: string, photoId: string) {
    const existingPhoto = await this.prisma.userPhoto.findFirst({
      where: { id: photoId, userId },
    });

    if (!existingPhoto) {
      throw new NotFoundException('Photo not found');
    }

    const deleted = await this.prisma.$transaction(async (tx) => {
      const hidden = await tx.userPhoto.update({
        where: { id: photoId },
        data: {
          isHidden: true,
          isPrimary: false,
        },
      });

      const fallback = await tx.userPhoto.findFirst({
        where: { userId, id: { not: photoId }, isHidden: false },
        orderBy: { sortOrder: 'asc' },
      });

      if (fallback) {
        await tx.userPhoto.update({
          where: { id: fallback.id },
          data: { isPrimary: true },
        });
      }

      return hidden;
    });

    await this.photoStorage.removeProfilePhoto(existingPhoto.storageKey);
    return deleted;
  }

  async getProfileCompleteness(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        fitnessProfile: true,
        photos: { where: { isHidden: false } },
      },
    });

    if (!user) {
      return {
        score: 0,
        prompts: [PROFILE_COMPLETENESS_PROMPTS.missingProfile],
      };
    }

    const checks = [
      { ok: !!user.firstName, prompt: PROFILE_COMPLETENESS_PROMPTS.firstName },
      { ok: !!user.birthdate, prompt: PROFILE_COMPLETENESS_PROMPTS.birthdate },
      {
        ok:
          !!user.profile?.bio &&
          user.profile.bio.length >= PROFILE_COMPLETENESS_BIO_MIN_CHARS,
        prompt: PROFILE_COMPLETENESS_PROMPTS.bio,
      },
      {
        ok: !!user.profile?.city,
        prompt: PROFILE_COMPLETENESS_PROMPTS.city,
      },
      {
        ok: user.photos.length >= PROFILE_COMPLETENESS_PHOTO_MIN_COUNT,
        prompt: PROFILE_COMPLETENESS_PROMPTS.photos,
      },
      {
        ok: !!user.fitnessProfile?.primaryGoal,
        prompt: PROFILE_COMPLETENESS_PROMPTS.primaryGoal,
      },
      {
        ok: !!user.fitnessProfile?.intensityLevel,
        prompt: PROFILE_COMPLETENESS_PROMPTS.intensity,
      },
      {
        ok: !!(
          user.fitnessProfile?.prefersMorning ||
          user.fitnessProfile?.prefersEvening
        ),
        prompt: PROFILE_COMPLETENESS_PROMPTS.availability,
      },
    ];

    const earned = checks.filter((c) => c.ok).length;
    const score = Math.round((earned / checks.length) * 100);
    const prompts = checks.filter((c) => !c.ok).map((c) => c.prompt);

    return { score, prompts };
  }
}
