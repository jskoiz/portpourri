import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PhotoStorageService } from './photo-storage.service';
import type { UpdateFitnessProfileDto, UpdatePhotoDto, UpdateProfileDto } from './profile.dto';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly photoStorage: PhotoStorageService,
  ) {}

  async updateFitnessProfile(userId: string, data: UpdateFitnessProfileDto) {
    // Strip userId from caller-supplied data to prevent overwriting the relation key
    const { userId: _ignored, ...safeData } = data;
    const profile = await this.prisma.$transaction(async (tx) => {
      const updatedProfile = await tx.userFitnessProfile.upsert({
        where: { userId },
        update: {
          ...safeData,
        },
        create: {
          userId,
          ...safeData,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { isOnboarded: true },
      });

      return updatedProfile;
    });

    return profile;
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    // Strip userId from caller-supplied data to prevent overwriting the relation key
    const { userId: _ignored, ...safeData } = data;
    return await this.prisma.userProfile.upsert({
      where: { userId },
      update: { ...safeData },
      create: { userId, ...safeData },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        fitnessProfile: true,
        profile: true,
        photos: {
          where: { isHidden: false },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!user) {
      this.logger.warn(`Profile not found for userId=${userId}`);
      return null;
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
      age: this.calculateAge(user.birthdate),
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
      return null;
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
          ...(data.isPrimary !== undefined ? { isPrimary: data.isPrimary } : {}),
          ...(data.isHidden !== undefined ? { isHidden: data.isHidden } : {}),
          ...(typeof data.sortOrder === 'number' ? { sortOrder: data.sortOrder } : {}),
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
      return null;
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

  private calculateAge(birthdate: Date | null | undefined): number | null {
    if (!birthdate) return null;
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const m = today.getMonth() - birthdate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
      age--;
    }
    return age;
  }
}
