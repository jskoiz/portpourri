import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IntensityLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  buildLikeReceivedNotification,
  buildMatchCreatedNotification,
} from '../notifications/notification.templates';
import { calculateAge } from '../common/age.util';
import { deriveMatchClassification } from '../matches/match-classification';
import {
  DISCOVERY_DISTANCE_SCORE_TIERS,
  DISCOVERY_FEED_QUERY_LIMIT,
  DISCOVERY_FEED_RESULT_LIMIT,
  DISCOVERY_SCORE_WEIGHTS,
  EARTH_RADIUS_KM,
  PROFILE_COMPLETENESS_CHECKS,
  PROFILE_COMPLETENESS_PROMPTS,
} from './discovery.constants';

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
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getFeed(userId: string, filters: DiscoveryFilters = {}) {
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, fitnessProfile: true },
    });

    if (!me) {
      throw new NotFoundException('User not found');
    }

    const birthdateFilter = this.buildBirthdateFilter(filters);
    const fitnessProfileFilter = this.buildFitnessProfileFilter(filters);

    const users: UserWithRelations[] = await this.prisma.user.findMany({
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
      select: {
        id: true,
        firstName: true,
        birthdate: true,
        fitnessProfile: {
          select: {
            primaryGoal: true,
            secondaryGoal: true,
            intensityLevel: true,
            prefersMorning: true,
            prefersEvening: true,
            favoriteActivities: true,
          },
        },
        profile: {
          select: {
            city: true,
            bio: true,
            latitude: true,
            longitude: true,
          },
        },
        photos: {
          where: { isHidden: false },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            storageKey: true,
            isPrimary: true,
            sortOrder: true,
          },
        },
      },
      take: DISCOVERY_FEED_QUERY_LIMIT,
    });

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
        const age = calculateAge(user.birthdate) ?? 0;
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
        const {
          latitude: _lat,
          longitude: _lon,
          ...safeProfile
        } = profile ?? {};
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
        (a, b) => (b?.recommendationScore || 0) - (a?.recommendationScore || 0),
      )
      .slice(0, DISCOVERY_FEED_RESULT_LIMIT);

    return scored;
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
    score += sharedGoals * DISCOVERY_SCORE_WEIGHTS.sharedGoal;

    if (
      me?.fitnessProfile?.intensityLevel &&
      candidate.fitnessProfile?.intensityLevel &&
      me.fitnessProfile.intensityLevel ===
        candidate.fitnessProfile.intensityLevel
    ) {
      score += DISCOVERY_SCORE_WEIGHTS.matchingIntensity;
    }

    if (distanceKm !== null) {
      const distanceTier = DISCOVERY_DISTANCE_SCORE_TIERS.find(
        ({ maxDistanceKm }) => distanceKm <= maxDistanceKm,
      );
      if (distanceTier) {
        score += distanceTier.score;
      }
    } else {
      score += DISCOVERY_SCORE_WEIGHTS.unknownDistance;
    }

    const ageDelta = Math.abs(age - DISCOVERY_SCORE_WEIGHTS.ageCenter);
    score += Math.max(0, DISCOVERY_SCORE_WEIGHTS.maxAgeBonus - ageDelta);

    if (candidate.fitnessProfile?.prefersMorning) {
      score += DISCOVERY_SCORE_WEIGHTS.availability;
    }
    if (candidate.fitnessProfile?.prefersEvening) {
      score += DISCOVERY_SCORE_WEIGHTS.availability;
    }

    if (candidate.photos?.length) score += DISCOVERY_SCORE_WEIGHTS.photo;
    if (candidate.profile?.bio) score += DISCOVERY_SCORE_WEIGHTS.bio;

    return score;
  }

  private calculateDistanceKm(
    fromLat?: number | null,
    fromLon?: number | null,
    toLat?: number | null,
    toLon?: number | null,
  ): number | null {
    if (fromLat == null || fromLon == null || toLat == null || toLon == null)
      return null;

    const toRad = (value: number) => (value * Math.PI) / 180;
    const dLat = toRad(toLat - fromLat);
    const dLon = toRad(toLon - fromLon);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(fromLat)) *
        Math.cos(toRad(toLat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  }

  async likeUser(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('Cannot like yourself');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId, isDeleted: false, isBanned: false },
      select: { id: true },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const existingLike = await tx.like.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId: userId,
            toUserId: targetUserId,
          },
        },
      });

      if (existingLike) return { status: 'already_liked' as const };

      await tx.pass.deleteMany({
        where: { fromUserId: userId, toUserId: targetUserId },
      });

      await tx.like.create({
        data: {
          fromUserId: userId,
          toUserId: targetUserId,
        },
      });

      const mutualLike = await tx.like.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId: targetUserId,
            toUserId: userId,
          },
        },
      });

      if (mutualLike) {
        const [userAId, userBId] = [userId, targetUserId].sort();

        const classification = await deriveMatchClassification(tx, [
          userId,
          targetUserId,
        ]);

        const match = await tx.match.upsert({
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

        return { status: 'match' as const, match };
      }

      return { status: 'liked' as const };
    });

    if (result.status !== 'already_liked') {
      void this.notifications
        .create(targetUserId, buildLikeReceivedNotification(userId))
        .catch((err) => this.logger.error('Failed to send notification', err));
    }

    if (result.status === 'match') {
      void this.notifications
        .create(
          userId,
          buildMatchCreatedNotification(result.match.id, targetUserId),
        )
        .catch((err) => this.logger.error('Failed to send notification', err));
      void this.notifications
        .create(
          targetUserId,
          buildMatchCreatedNotification(result.match.id, userId),
        )
        .catch((err) => this.logger.error('Failed to send notification', err));
    }

    return result;
  }

  async passUser(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('Cannot pass on yourself');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId, isDeleted: false, isBanned: false },
      select: { id: true },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const existingPass = await tx.pass.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId: userId,
            toUserId: targetUserId,
          },
        },
      });

      if (existingPass) return { status: 'already_passed' as const };

      await tx.like.deleteMany({
        where: { fromUserId: userId, toUserId: targetUserId },
      });

      await tx.pass.create({
        data: {
          fromUserId: userId,
          toUserId: targetUserId,
        },
      });

      return { status: 'passed' as const };
    });
  }

  async undoLastSwipe(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const [lastLike, lastPass] = await Promise.all([
        tx.like.findFirst({
          where: { fromUserId: userId },
          orderBy: { createdAt: 'desc' },
        }),
        tx.pass.findFirst({
          where: { fromUserId: userId },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      if (!lastLike && !lastPass) return { status: 'nothing_to_undo' as const };

      const undoLike =
        !!lastLike && (!lastPass || lastLike.createdAt >= lastPass.createdAt);

      if (undoLike && lastLike) {
        await tx.like.delete({ where: { id: lastLike.id } });

        const [userAId, userBId] = [userId, lastLike.toUserId].sort();
        const existingMatch = await tx.match.findUnique({
          where: { userAId_userBId: { userAId, userBId } },
        });

        let archivedMatchId: string | undefined;
        if (existingMatch && !existingMatch.isArchived) {
          await tx.match.update({
            where: { id: existingMatch.id },
            data: { isArchived: true },
          });
          archivedMatchId = existingMatch.id;
        }

        return {
          status: 'undone' as const,
          action: 'like' as const,
          targetUserId: lastLike.toUserId,
          ...(archivedMatchId ? { archivedMatchId } : {}),
        };
      }

      if (lastPass) {
        await tx.pass.delete({ where: { id: lastPass.id } });
        return {
          status: 'undone' as const,
          action: 'pass' as const,
          targetUserId: lastPass.toUserId,
        };
      }

      return { status: 'nothing_to_undo' as const };
    });
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
        total: PROFILE_COMPLETENESS_CHECKS.length,
        earned: 0,
        prompts: [PROFILE_COMPLETENESS_PROMPTS.missingProfile],
        missing: PROFILE_COMPLETENESS_CHECKS.map((c) => ({
          field: c.field,
          label: c.label,
          route: c.route,
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

    return { score, total: checks.length, earned, prompts, missing };
  }

}
