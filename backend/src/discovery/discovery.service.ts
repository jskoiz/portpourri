import {
  BadRequestException,
  ForbiddenException,
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
import { BlockService } from '../moderation/block.service';
import { calculateAge } from '../common/age.util';
import { deriveMatchClassification } from '../matches/match-classification';
import {
  DISCOVERY_DISTANCE_SCORE_TIERS,
  DISCOVERY_FEED_QUERY_LIMIT,
  DISCOVERY_FEED_RESULT_LIMIT,
  DISCOVERY_SCORE_WEIGHTS,
  EARTH_RADIUS_KM,
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
    latitude?: number | null;
    longitude?: number | null;
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

interface RecommendationContext {
  fitnessProfile: {
    intensityLevel?: IntensityLevel | null;
  } | null;
  goals: Set<string>;
}

function asLogMessage(event: string, context: Record<string, unknown>) {
  return JSON.stringify({ event, ...context });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly blockService: BlockService,
  ) {}

  async getFeed(userId: string, filters: DiscoveryFilters = {}) {
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, fitnessProfile: true },
    });

    if (!me) {
      this.logger.warn(
        asLogMessage('discovery.feed.user_missing', {
          userId,
        }),
      );
      throw new NotFoundException('User not found');
    }

    const birthdateFilter = this.buildBirthdateFilter(filters);
    const fitnessProfileFilter = this.buildFitnessProfileFilter(filters);

    const blockedIds = await this.blockService.getBlockedUserIds(userId);
    const requesterLatitude = me.profile?.latitude ?? null;
    const requesterLongitude = me.profile?.longitude ?? null;
    const requesterHasCoordinates =
      requesterLatitude !== null && requesterLongitude !== null;
    const maxDistanceKm = this.resolveDistanceFilter(filters.distanceKm);
    const profileFilter = this.buildProfileFilter(
      requesterLatitude,
      requesterLongitude,
      maxDistanceKm,
    );

    const users: UserWithRelations[] = await this.prisma.user.findMany({
      where: {
        id: { notIn: [userId, ...blockedIds] },
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
        ...(profileFilter
          ? {
              profile: {
                is: profileFilter,
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
            ...(requesterHasCoordinates
              ? {
                  latitude: true,
                  longitude: true,
                }
              : {}),
          },
        },
        photos: {
          where: { isHidden: false },
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          take: 1,
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

    const meForScore: RecommendationContext = {
      fitnessProfile: me.fitnessProfile
        ? {
            intensityLevel: me.fitnessProfile.intensityLevel,
          }
        : null,
      goals: new Set(
        [me.fitnessProfile?.primaryGoal, me.fitnessProfile?.secondaryGoal]
          .filter(Boolean)
          .map((goal) => String(goal).toLowerCase()),
      ),
    };

    const scored = users
      .map((user) => {
        const age = calculateAge(user.birthdate) ?? 0;
        const distanceKm = this.calculateDistanceKm(
          requesterLatitude,
          requesterLongitude,
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

    this.logger.debug(
      asLogMessage('discovery.feed.generated', {
        userId,
        blockedCount: blockedIds.length,
        candidateCount: users.length,
        returnedCount: scored.length,
        filters: {
          hasDistanceKm: typeof maxDistanceKm === 'number',
          hasMinAge: typeof filters.minAge === 'number',
          hasMaxAge: typeof filters.maxAge === 'number',
          goalsCount: filters.goals?.length ?? 0,
          intensityCount: filters.intensity?.length ?? 0,
          availabilityCount: filters.availability?.length ?? 0,
        },
        requesterHasCoordinates,
      }),
    );

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

  private resolveDistanceFilter(distanceKm?: number) {
    if (
      typeof distanceKm === 'number' &&
      Number.isFinite(distanceKm) &&
      distanceKm > 0
    ) {
      return distanceKm;
    }

    return null;
  }

  private buildProfileFilter(
    requesterLatitude: number | null,
    requesterLongitude: number | null,
    maxDistanceKm: number | null,
  ) {
    if (
      maxDistanceKm === null ||
      requesterLatitude === null ||
      requesterLongitude === null
    ) {
      return null;
    }

    const latitudeDelta = maxDistanceKm / 111;
    const longitudeScale = Math.max(
      0.01,
      Math.abs(Math.cos((requesterLatitude * Math.PI) / 180)),
    );
    const longitudeDelta = maxDistanceKm / (111 * longitudeScale);

    const minLon = requesterLongitude - longitudeDelta;
    const maxLon = requesterLongitude + longitudeDelta;

    // When the bounding box crosses the antimeridian (180/-180 boundary),
    // minLon > maxLon after clamping, so we use OR: lon >= minLon OR lon <= maxLon.
    const longitudeFilter =
      minLon > maxLon
        ? { OR: [{ longitude: { gte: minLon } }, { longitude: { lte: maxLon } }] }
        : { longitude: { gte: minLon, lte: maxLon } };

    return {
      AND: [
        {
          latitude: {
            gte: requesterLatitude - latitudeDelta,
            lte: requesterLatitude + latitudeDelta,
          },
        },
        longitudeFilter,
      ],
    };
  }

  private getBirthdateBoundary(age: number) {
    const boundary = new Date();
    boundary.setFullYear(boundary.getFullYear() - age);
    return boundary;
  }

  private computeRecommendationScore(
    me: RecommendationContext,
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
    const sharedGoals = candidateGoals.filter((goal) =>
      me.goals.has(goal),
    ).length;
    score += sharedGoals * DISCOVERY_SCORE_WEIGHTS.sharedGoal;

    if (
      me.fitnessProfile?.intensityLevel &&
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
      this.logger.warn(
        asLogMessage('discovery.like.rejected_self', {
          userId,
          targetUserId,
        }),
      );
      throw new BadRequestException('Cannot like yourself');
    }

    if (await this.blockService.isBlocked(userId, targetUserId)) {
      throw new NotFoundException('User not found');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId, isDeleted: false, isBanned: false },
      select: { id: true },
    });
    if (!targetUser) {
      this.logger.warn(
        asLogMessage('discovery.like.target_missing', {
          userId,
          targetUserId,
        }),
      );
      throw new NotFoundException('User not found');
    }

    if (await this.blockService.isBlocked(userId, targetUserId)) {
      throw new ForbiddenException('This user is no longer available');
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
        const existingMatch = await tx.match.findUnique({
          where: {
            userAId_userBId: {
              userAId,
              userBId,
            },
          },
          select: {
            id: true,
            isBlocked: true,
          },
        });

        if (existingMatch?.isBlocked) {
          throw new NotFoundException('User not found');
        }

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
            isArchived: false,
            ...classification,
          },
        });

        return { status: 'match' as const, match };
      }

      return { status: 'liked' as const };
    });

    this.logger.debug(
      asLogMessage('discovery.like.completed', {
        userId,
        targetUserId,
        outcome: result.status,
        matchId: result.status === 'match' ? result.match.id : undefined,
      }),
    );

    if (result.status !== 'already_liked') {
      void this.notifications
        .create(targetUserId, buildLikeReceivedNotification(userId))
        .catch((err) =>
          this.logger.error(
            asLogMessage('discovery.notification_failed', {
              operation: 'like_received',
              userId,
              targetUserId,
              error: errorMessage(err),
            }),
            err instanceof Error ? err.stack : undefined,
          ),
        );
    }

    if (result.status === 'match') {
      void this.notifications
        .create(
          userId,
          buildMatchCreatedNotification(result.match.id, targetUserId),
        )
        .catch((err) =>
          this.logger.error(
            asLogMessage('discovery.notification_failed', {
              operation: 'match_created_actor',
              userId,
              targetUserId,
              matchId: result.match.id,
              error: errorMessage(err),
            }),
            err instanceof Error ? err.stack : undefined,
          ),
        );
      void this.notifications
        .create(
          targetUserId,
          buildMatchCreatedNotification(result.match.id, userId),
        )
        .catch((err) =>
          this.logger.error(
            asLogMessage('discovery.notification_failed', {
              operation: 'match_created_target',
              userId,
              targetUserId,
              matchId: result.match.id,
              error: errorMessage(err),
            }),
            err instanceof Error ? err.stack : undefined,
          ),
        );
    }

    return result;
  }

  async passUser(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      this.logger.warn(
        asLogMessage('discovery.pass.rejected_self', {
          userId,
          targetUserId,
        }),
      );
      throw new BadRequestException('Cannot pass on yourself');
    }

    if (await this.blockService.isBlocked(userId, targetUserId)) {
      throw new NotFoundException('User not found');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId, isDeleted: false, isBanned: false },
      select: { id: true },
    });
    if (!targetUser) {
      this.logger.warn(
        asLogMessage('discovery.pass.target_missing', {
          userId,
          targetUserId,
        }),
      );
      throw new NotFoundException('User not found');
    }

    if (await this.blockService.isBlocked(userId, targetUserId)) {
      throw new ForbiddenException('This user is no longer available');
    }

    const result = await this.prisma.$transaction(async (tx) => {
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

    this.logger.debug(
      asLogMessage('discovery.pass.completed', {
        userId,
        targetUserId,
        outcome: result.status,
      }),
    );

    return result;
  }

  async undoLastSwipe(userId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
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

    this.logger.debug(
      asLogMessage('discovery.undo.completed', {
        userId,
        outcome: result.status,
        action: 'action' in result ? result.action : undefined,
        targetUserId: 'targetUserId' in result ? result.targetUserId : undefined,
        archivedMatchId:
          'archivedMatchId' in result ? result.archivedMatchId : undefined,
      }),
    );

    return result;
  }

}
