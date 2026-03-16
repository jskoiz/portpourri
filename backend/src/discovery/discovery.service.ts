import { Injectable, Logger } from '@nestjs/common';
import { IntensityLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { deriveMatchClassification } from '../matches/match-classification';

export interface DiscoveryFilters {
  distanceKm?: number;
  minAge?: number;
  maxAge?: number;
  goals?: string[];
  intensity?: string[];
  availability?: ('morning' | 'evening')[];
}

interface UserWithRelations {
  id: string;
  firstName: string;
  birthdate: Date;
  profile: {
    city: string | null;
    bio: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  fitnessProfile: {
    primaryGoal: string | null;
    secondaryGoal: string | null;
    intensityLevel: IntensityLevel;
    prefersMorning: boolean | null;
    prefersEvening: boolean | null;
    favoriteActivities: string | null;
  } | null;
  photos: Array<{
    id: string;
    storageKey: string;
    isPrimary: boolean;
    sortOrder: number;
  }>;
}

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    private prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getFeed(userId: string, filters: DiscoveryFilters = {}) {
    try {
      const me = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true, fitnessProfile: true },
      });

      const birthdateFilter = this.buildBirthdateFilter(filters);
      const fitnessProfileFilter = this.buildFitnessProfileFilter(filters);

      const users = (await this.prisma.user.findMany({
        where: {
          id: { not: userId },
          isDeleted: false,
          isBanned: false,
          isOnboarded: true,
          receivedLikes: { none: { fromUserId: userId } },
          receivedPasses: { none: { fromUserId: userId } },
          ...(birthdateFilter ? { birthdate: birthdateFilter } : {}),
          ...(fitnessProfileFilter
            ? {
                fitnessProfile: {
                  is: fitnessProfileFilter,
                },
              }
            : {}),
        },
        include: {
          fitnessProfile: true,
          profile: true,
          photos: {
            where: { isHidden: false },
            orderBy: { sortOrder: 'asc' },
          },
        },
        take: 100,
      })) as unknown as UserWithRelations[];

      let maxDistanceKm: number | null = null;
      if (
        typeof filters.distanceKm === 'number' &&
        Number.isFinite(filters.distanceKm) &&
        filters.distanceKm > 0
      ) {
        maxDistanceKm = filters.distanceKm;
      }
      const requesterHasCoordinates =
        me?.profile?.latitude !== null &&
        me?.profile?.latitude !== undefined &&
        me?.profile?.longitude !== null &&
        me?.profile?.longitude !== undefined;

      const scored = users
        .map((user) => {
          const age = this.calculateAge(user.birthdate);
          const distanceKm = this.calculateDistanceKm(
            me?.profile?.latitude,
            me?.profile?.longitude,
            user.profile?.latitude,
            user.profile?.longitude,
          );

          if (filters.minAge && age < filters.minAge) return null;
          if (filters.maxAge && age > filters.maxAge) return null;
          if (
            maxDistanceKm !== null &&
            requesterHasCoordinates &&
            (distanceKm === null || distanceKm > maxDistanceKm)
          )
            return null;

          const meForScore = me
            ? {
                fitnessProfile: me.fitnessProfile
                  ? {
                      intensityLevel: me.fitnessProfile.intensityLevel,
                      primaryGoal: me.fitnessProfile.primaryGoal,
                      secondaryGoal: me.fitnessProfile.secondaryGoal,
                    }
                  : null,
              }
            : null;
          const score = this.computeRecommendationScore(
            meForScore,
            user,
            age,
            distanceKm,
          );
          const { profile, ...userWithoutProfile } = user;
          const { latitude, longitude, ...safeProfile } = profile ?? {};
          return {
            ...userWithoutProfile,
            profile: safeProfile,
            age,
            distanceKm,
            recommendationScore: score,
          };
        })
        .filter(Boolean)
        .sort(
          (a, b) =>
            (b?.recommendationScore || 0) - (a?.recommendationScore || 0),
        )
        .slice(0, 20);

      return scored;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Feed query failed for userId=${userId}: ${message}`,
        stack,
      );
      throw error;
    }
  }

  private buildBirthdateFilter(filters: DiscoveryFilters) {
    const birthdateFilter: {
      gte?: Date;
      lte?: Date;
    } = {};

    if (filters.maxAge) {
      birthdateFilter.gte = this.getBirthdateBoundary(filters.maxAge + 1);
    }

    if (filters.minAge) {
      birthdateFilter.lte = this.getBirthdateBoundary(filters.minAge);
    }

    return Object.keys(birthdateFilter).length ? birthdateFilter : null;
  }

  private buildFitnessProfileFilter(filters: DiscoveryFilters) {
    const normalizedGoals = filters.goals?.length
      ? filters.goals.map((goal) => goal.toLowerCase())
      : [];
    const normalizedIntensity = filters.intensity?.length
      ? filters.intensity.map((level) => level.toLowerCase())
      : [];
    const availabilityFilter = this.buildAvailabilityFilter(filters);

    const andFilters: Array<Record<string, unknown>> = [];

    if (normalizedGoals.length) {
      andFilters.push({
        OR: normalizedGoals.flatMap((goal) => [
          {
            primaryGoal: {
              equals: goal,
              mode: 'insensitive' as const,
            },
          },
          {
            secondaryGoal: {
              equals: goal,
              mode: 'insensitive' as const,
            },
          },
        ]),
      });
    }

    if (normalizedIntensity.length) {
      const intensityEnums = normalizedIntensity
        .map((i) => i.toUpperCase())
        .filter((i): i is IntensityLevel =>
          Object.values(IntensityLevel).includes(i as IntensityLevel),
        );
      if (intensityEnums.length) {
        andFilters.push({
          intensityLevel: {
            in: intensityEnums,
          },
        });
      }
    }

    if (availabilityFilter) {
      andFilters.push(availabilityFilter);
    }

    if (!andFilters.length) return null;
    if (andFilters.length === 1) return andFilters[0];

    return { AND: andFilters };
  }

  private buildAvailabilityFilter(filters: DiscoveryFilters) {
    const wantMorning = !!filters.availability?.includes('morning');
    const wantEvening = !!filters.availability?.includes('evening');

    if (!wantMorning && !wantEvening) return null;

    return {
      OR: [
        ...(wantMorning ? [{ prefersMorning: true }] : []),
        ...(wantEvening ? [{ prefersEvening: true }] : []),
      ],
    };
  }

  private getBirthdateBoundary(age: number) {
    const boundary = new Date();
    boundary.setFullYear(boundary.getFullYear() - age);
    return boundary;
  }

  private computeRecommendationScore(
    me: {
      fitnessProfile?: {
        intensityLevel?: IntensityLevel | null;
        primaryGoal?: string | null;
        secondaryGoal?: string | null;
      } | null;
    } | null,
    candidate: UserWithRelations,
    age: number,
    distanceKm: number | null,
  ): number {
    let score = 0;

    const candidateGoals = [
      candidate.fitnessProfile?.primaryGoal,
      candidate.fitnessProfile?.secondaryGoal,
    ]
      .filter(Boolean)
      .map((g) => String(g).toLowerCase());
    const myGoals = [
      me?.fitnessProfile?.primaryGoal,
      me?.fitnessProfile?.secondaryGoal,
    ]
      .filter(Boolean)
      .map((g) => String(g).toLowerCase());

    const sharedGoals = candidateGoals.filter((goal) =>
      myGoals.includes(goal),
    ).length;
    score += sharedGoals * 28;

    if (
      me?.fitnessProfile?.intensityLevel &&
      candidate.fitnessProfile?.intensityLevel &&
      me.fitnessProfile.intensityLevel ===
        candidate.fitnessProfile.intensityLevel
    ) {
      score += 20;
    }

    if (distanceKm !== null) {
      if (distanceKm <= 5) score += 25;
      else if (distanceKm <= 15) score += 18;
      else if (distanceKm <= 30) score += 10;
      else if (distanceKm <= 50) score += 4;
    } else {
      score += 3;
    }

    // Soft age preference around the center of common 24-35 bracket for active users.
    const ageDelta = Math.abs(age - 29);
    score += Math.max(0, 12 - ageDelta);

    if (candidate.fitnessProfile?.prefersMorning) score += 5;
    if (candidate.fitnessProfile?.prefersEvening) score += 5;

    if (candidate.photos?.length) score += 4;
    if (candidate.profile?.bio) score += 3;

    return score;
  }

  private calculateAge(birthdate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const m = today.getMonth() - birthdate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
      age--;
    }
    return age;
  }

  private calculateDistanceKm(
    fromLat?: number | null,
    fromLon?: number | null,
    toLat?: number | null,
    toLon?: number | null,
  ): number | null {
    if (
      [fromLat, fromLon, toLat, toLon].some(
        (value) => value === null || value === undefined,
      )
    )
      return null;

    const toRad = (value: number) => (value * Math.PI) / 180;
    const dLat = toRad((toLat as number) - (fromLat as number));
    const dLon = toRad((toLon as number) - (fromLon as number));
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(fromLat as number)) *
        Math.cos(toRad(toLat as number)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 6371 * c;
  }

  async likeUser(userId: string, targetUserId: string) {
    try {
      const existingLike = await this.prisma.like.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId: userId,
            toUserId: targetUserId,
          },
        },
      });

      if (existingLike) return { status: 'already_liked' };

      await this.prisma.pass.deleteMany({
        where: { fromUserId: userId, toUserId: targetUserId },
      });

      await this.prisma.like.create({
        data: {
          fromUserId: userId,
          toUserId: targetUserId,
        },
      });

      this.notifications.create(targetUserId, {
        type: 'like_received',
        title: 'New like',
        body: 'Someone liked your profile.',
        data: { fromUserId: userId },
      });

      const mutualLike = await this.prisma.like.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId: targetUserId,
            toUserId: userId,
          },
        },
      });

      if (mutualLike) {
        const [userAId, userBId] = [userId, targetUserId].sort();

        const classification = await deriveMatchClassification(this.prisma, [
          userId,
          targetUserId,
        ]);

        const match = await this.prisma.match.upsert({
          where: {
            userAId_userBId: {
              userAId,
              userBId,
            },
          },
          create: {
            userAId,
            userBId,
            ...classification,
          },
          update: {
            updatedAt: new Date(),
            isBlocked: false,
            isArchived: false,
            ...classification,
          },
        });

        this.notifications.create(userId, {
          type: 'match_created',
          title: "It's a match!",
          body: 'You can start chatting now.',
          data: { matchId: match.id, withUserId: targetUserId },
        });
        this.notifications.create(targetUserId, {
          type: 'match_created',
          title: "It's a match!",
          body: 'You can start chatting now.',
          data: { matchId: match.id, withUserId: userId },
        });

        return { status: 'match', match };
      }

      return { status: 'liked' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Like action failed for userId=${userId}, targetUserId=${targetUserId}: ${message}`,
        stack,
      );
      throw error;
    }
  }

  async passUser(userId: string, targetUserId: string) {
    try {
      const existingPass = await this.prisma.pass.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId: userId,
            toUserId: targetUserId,
          },
        },
      });

      if (existingPass) return { status: 'already_passed' };

      await this.prisma.like.deleteMany({
        where: { fromUserId: userId, toUserId: targetUserId },
      });

      await this.prisma.pass.create({
        data: {
          fromUserId: userId,
          toUserId: targetUserId,
        },
      });

      return { status: 'passed' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Pass action failed for userId=${userId}, targetUserId=${targetUserId}: ${message}`,
        stack,
      );
      throw error;
    }
  }

  async undoLastSwipe(userId: string) {
    try {
      const [lastLike, lastPass] = await Promise.all([
        this.prisma.like.findFirst({
          where: { fromUserId: userId },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.pass.findFirst({
          where: { fromUserId: userId },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      if (!lastLike && !lastPass) return { status: 'nothing_to_undo' };

      const undoLike =
        !!lastLike && (!lastPass || lastLike.createdAt >= lastPass.createdAt);

      if (undoLike && lastLike) {
        await this.prisma.like.delete({ where: { id: lastLike.id } });
        return {
          status: 'undone',
          action: 'like',
          targetUserId: lastLike.toUserId,
        };
      }

      if (lastPass) {
        await this.prisma.pass.delete({ where: { id: lastPass.id } });
        return {
          status: 'undone',
          action: 'pass',
          targetUserId: lastPass.toUserId,
        };
      }

      return { status: 'nothing_to_undo' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `undoLastSwipe failed for userId=${userId}: ${message}`,
        stack,
      );
      throw error;
    }
  }

  async getProfileCompleteness(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          fitnessProfile: true,
          photos: { where: { isHidden: false } },
        },
      });

      if (!user) return { score: 0, prompts: ['Complete your profile setup.'] };

      const checks = [
        { ok: !!user.firstName, prompt: 'Add your first name.' },
        { ok: !!user.birthdate, prompt: 'Add your birthday.' },
        {
          ok: !!user.profile?.bio && user.profile.bio.length >= 20,
          prompt: 'Write a bio (20+ chars) so people know your vibe.',
        },
        {
          ok: !!user.profile?.city,
          prompt: 'Add your city for better nearby matches.',
        },
        {
          ok: user.photos.length >= 2,
          prompt: 'Upload at least 2 profile photos.',
        },
        {
          ok: !!user.fitnessProfile?.primaryGoal,
          prompt: 'Set a primary fitness goal.',
        },
        {
          ok: !!user.fitnessProfile?.intensityLevel,
          prompt: 'Choose your training intensity.',
        },
        {
          ok: !!(
            user.fitnessProfile?.prefersMorning ||
            user.fitnessProfile?.prefersEvening
          ),
          prompt: 'Set your availability (morning/evening).',
        },
      ];

      const earned = checks.filter((c) => c.ok).length;
      const score = Math.round((earned / checks.length) * 100);
      const prompts = checks.filter((c) => !c.ok).map((c) => c.prompt);

      return { score, prompts };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `getProfileCompleteness failed for userId=${userId}: ${message}`,
        stack,
      );
      throw error;
    }
  }
}
