import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { calculateAge } from '../common/age.util';
import { PHOTO_STORAGE } from './storage.provider';
import type { IPhotoStorage } from './photo-storage.service';
import { BlockService } from '../moderation/block.service';
import {
  PROFILE_COMPLETENESS_CHECKS,
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

  private sanitizeOwnProfile<T extends Record<string, unknown>>(user: T) {
    const {
      passwordHash: _ph,
      providerId: _pid,
      authProvider: _ap,
      ...safeUser
    } = user;

    return safeUser;
  }

  private sanitizePublicProfile<
    T extends Record<string, unknown> & { birthdate?: Date | null },
  >(user: T) {
    const {
      passwordHash: _ph,
      providerId: _pid,
      authProvider: _ap,
      email: _email,
      phoneNumber: _phoneNumber,
      hasVerifiedEmail: _hasVerifiedEmail,
      hasVerifiedPhone: _hasVerifiedPhone,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      birthdate: _birthdate,
      ...safeUser
    } = user;

    return safeUser;
  }

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PHOTO_STORAGE) private readonly photoStorage: IPhotoStorage,
    private readonly blockService: BlockService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
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

    await this.cache.del(`completeness:${userId}`);
    await this.cache.del(`pub-profile:${userId}`);

    // Re-fetch and return the full user profile so callers get a consistent shape
    return this.getProfile(userId);
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const {
      showMeMen,
      showMeWomen,
      ...profileData
    } = data;

    const hasDiscoveryPreferenceUpdate =
      typeof showMeMen === 'boolean' || typeof showMeWomen === 'boolean';

    await this.prisma.$transaction(async (tx) => {
      if (hasDiscoveryPreferenceUpdate) {
        const currentProfile = await tx.userProfile.findUnique({
          where: { userId },
          select: {
            showMeMen: true,
            showMeWomen: true,
          },
        });

        const nextShowMeMen =
          typeof showMeMen === 'boolean'
            ? showMeMen
            : currentProfile?.showMeMen ?? true;
        const nextShowMeWomen =
          typeof showMeWomen === 'boolean'
            ? showMeWomen
            : currentProfile?.showMeWomen ?? true;

        if (!nextShowMeMen && !nextShowMeWomen) {
          throw new BadRequestException('Choose at least one discovery preference');
        }

        await tx.userProfile.upsert({
          where: { userId },
          update: {
            showMeMen: nextShowMeMen,
            showMeWomen: nextShowMeWomen,
          },
          create: {
            userId,
            showMeMen: nextShowMeMen,
            showMeWomen: nextShowMeWomen,
          },
        });
      }

      if (Object.keys(profileData).length > 0) {
        await tx.userProfile.upsert({
          where: { userId },
          update: { ...profileData },
          create: { userId, ...profileData },
        });
      }
    });

    await this.cache.del(`completeness:${userId}`);
    await this.cache.del(`pub-profile:${userId}`);

    return this.getProfile(userId);
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

    return {
      ...this.sanitizeOwnProfile(user),
      age: calculateAge(user.birthdate),
    };
  }

  async getPublicProfile(userId: string, viewerId?: string) {
    if (viewerId && (await this.blockService.isBlocked(viewerId, userId))) {
      this.logger.warn(
        `Public profile suppressed for viewerId=${viewerId} userId=${userId}`,
      );
      return null;
    }

    const cacheKey = `pub-profile:${userId}`;
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

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
      this.logger.warn(`Public profile not found for userId=${userId}`);
      return null;
    }

    const result = {
      ...this.sanitizePublicProfile(user),
      age: calculateAge(user.birthdate),
    };
    await this.cache.set(cacheKey, result, 180_000); // 3 min
    return result;
  }

  async uploadPhoto(userId: string, file: Express.Multer.File) {
    const uploaded = await this.photoStorage.saveProfilePhoto(file);

    try {
      await this.prisma.$transaction(async (tx) => {
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

        await tx.userPhoto.create({
          data: {
            userId,
            storageKey: uploaded.storageKey,
            sortOrder: nextSortOrder,
            isPrimary: shouldBePrimary,
          },
        });
      });

      await this.cache.del(`completeness:${userId}`);
      await this.cache.del(`pub-profile:${userId}`);

      return this.getProfile(userId);
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

    await this.prisma.$transaction(async (tx) => {
      if (
        typeof data.sortOrder === 'number' &&
        data.sortOrder !== existingPhoto.sortOrder
      ) {
        const conflictingPhoto = await tx.userPhoto.findFirst({
          where: {
            userId,
            id: { not: photoId },
            isHidden: false,
            sortOrder: data.sortOrder,
          },
        });

        if (conflictingPhoto) {
          await tx.userPhoto.update({
            where: { id: conflictingPhoto.id },
            data: { sortOrder: existingPhoto.sortOrder },
          });
        }
      }

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

    await this.cache.del(`completeness:${userId}`);
    await this.cache.del(`pub-profile:${userId}`);

    return this.getProfile(userId);
  }

  async deletePhoto(userId: string, photoId: string) {
    const existingPhoto = await this.prisma.userPhoto.findFirst({
      where: { id: photoId, userId },
    });

    if (!existingPhoto) {
      throw new NotFoundException('Photo not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userPhoto.update({
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
    });

    await this.photoStorage.removeProfilePhoto(existingPhoto.storageKey);

    await this.cache.del(`completeness:${userId}`);
    await this.cache.del(`pub-profile:${userId}`);

    return this.getProfile(userId);
  }

  async getProfileCompleteness(userId: string) {
    const cacheKey = `completeness:${userId}`;
    const cached = await this.cache.get<{
      score: number;
      total: number;
      earned: number;
      prompts: string[];
      missing: Array<{ field: string; label: string; route: string }>;
    }>(cacheKey);
    if (cached) return cached;

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
        total: PROFILE_COMPLETENESS_CHECKS.length,
        earned: 0,
        prompts: [PROFILE_COMPLETENESS_PROMPTS.missingProfile],
        missing: PROFILE_COMPLETENESS_CHECKS.map((check) => ({
          field: check.field,
          label: check.label,
          route: check.route,
        })),
      };
    }

    const checks = PROFILE_COMPLETENESS_CHECKS.map((check) => ({
      ...check,
      ok: check.test(user),
    }));

    const earned = checks.filter((c) => c.ok).length;
    const score = Math.round((earned / checks.length) * 100);
    const prompts = checks.filter((c) => !c.ok).map((c) => c.prompt);
    const missing = checks
      .filter((c) => !c.ok)
      .map((c) => ({ field: c.field, label: c.label, route: c.route }));

    const result = { score, total: checks.length, earned, prompts, missing };
    await this.cache.set(cacheKey, result, 600_000); // 10 min
    return result;
  }
}
