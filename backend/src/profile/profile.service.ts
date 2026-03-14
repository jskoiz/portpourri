import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private prisma: PrismaService) {}

  async updateFitnessProfile(userId: string, data: Record<string, unknown>) {
    // Strip userId from caller-supplied data to prevent overwriting the relation key
    const { userId: _ignored, ...safeData } = data;
    try {
      const profile = await this.prisma.userFitnessProfile.upsert({
        where: { userId },
        update: {
          ...safeData,
        },
        create: {
          userId,
          ...safeData,
        },
      });

      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnboarded: true },
      });

      return profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed updating fitness profile for userId=${userId}: ${message}`,
        stack,
      );
      throw error;
    }
  }

  async updateProfile(userId: string, data: Record<string, unknown>) {
    // Strip userId from caller-supplied data to prevent overwriting the relation key
    const { userId: _ignored, ...safeData } = data;
    try {
      return await this.prisma.userProfile.upsert({
        where: { userId },
        update: { ...safeData },
        create: { userId, ...safeData },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed updating profile for userId=${userId}: ${message}`,
        stack,
      );
      throw error;
    }
  }

  async getProfile(userId: string) {
    try {
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

      return {
        ...user,
        age: this.calculateAge(user.birthdate),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed loading profile for userId=${userId}: ${message}`,
        stack,
      );
      throw error;
    }
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
