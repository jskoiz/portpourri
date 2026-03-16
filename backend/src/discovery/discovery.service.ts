import { Injectable, Logger } from '@nestjs/common';
import { IntensityLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  buildLikeReceivedNotification,
  buildMatchCreatedNotification,
} from '../notifications/notification.templates';
import { deriveMatchClassification } from '../matches/match-classification';
import {
  DISCOVERY_DISTANCE_SCORE_TIERS,
  DISCOVERY_FEED_QUERY_LIMIT,
  DISCOVERY_FEED_RESULT_LIMIT,
  DISCOVERY_SCORE_WEIGHTS,
  EARTH_RADIUS_KM,
  PROFILE_COMPLETENESS_BIO_MIN_CHARS,
  PROFILE_COMPLETENESS_PHOTO_MIN_COUNT,
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
      include: {
        fitnessProfile: true,
        profile: true,
        photos: {
          where: { isHidden: false },
          orderBy: { sortOrder: 'asc' },
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
    return EARTH_RADIUS_KM * c;
  }

  async likeUser(userId: string, targetUserId: string) {
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

    void this.notifications.create(
      targetUserId,
      buildLikeReceivedNotification(userId),
    );

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

      void this.notifications.create(
        userId,
        buildMatchCreatedNotification(match.id, targetUserId),
      );
      void this.notifications.create(
        targetUserId,
        buildMatchCreatedNotification(match.id, userId),
      );

      return { status: 'match', match };
    }

    return { status: 'liked' };
  }

  async passUser(userId: string, targetUserId: string) {
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
  }

  async undoLastSwipe(userId: string) {
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
      return { score: 0, prompts: [PROFILE_COMPLETENESS_PROMPTS.missingProfile] };
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
