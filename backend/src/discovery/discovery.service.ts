import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { createHash } from 'crypto';
import { Gender, IntensityLevel } from '@prisma/client';
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
    latitude: number | null;
    longitude: number | null;
    intentDating: boolean;
    intentWorkout: boolean;
    intentFriends: boolean;
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

interface DiscoveryRequester {
  id: string;
  gender: Gender;
  showMeMen: boolean;
  showMeWomen: boolean;
  profile: {
    latitude: number | null;
    longitude: number | null;
  } | null;
  fitnessProfile: {
    primaryGoal: string | null;
    secondaryGoal: string | null;
    intensityLevel: IntensityLevel;
  } | null;
}

interface SanitizedDiscoveryProfile {
  city: string | null;
  bio: string | null;
  intentDating: boolean | null;
  intentWorkout: boolean | null;
  intentFriends: boolean | null;
}

export interface DiscoveryFeedEntry extends Omit<UserWithRelations, 'profile'> {
  age: number;
  distanceKm: number | null;
  profile: SanitizedDiscoveryProfile;
  recommendationScore: number;
}

interface SwipeRecord {
  id: string;
  toUserId: string;
  createdAt: Date;
}

type DiscoveryTransaction = Pick<
  PrismaService,
  'like' | 'match' | 'pass' | 'userProfile'
>;

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
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private feedCacheKey(userId: string, filters: DiscoveryFilters): string {
    const hash = createHash('md5').update(JSON.stringify(filters)).digest('hex').slice(0, 12);
    return `feed:${userId}:${hash}`;
  }

  private blockedCacheKey(userId: string): string {
    return `blocked:${userId}`;
  }

  async getFeed(userId: string, filters: DiscoveryFilters = {}) {
    // Check feed cache first
    const cacheKey = this.feedCacheKey(userId, filters);
    const cached = await this.cache.get<DiscoveryFeedEntry[]>(cacheKey);
    if (cached) return cached;

    const me = await this.getRequesterOrThrow(userId);

    // Cache blocked IDs (5 min)
    const blockedKey = this.blockedCacheKey(userId);
    let blockedIds = await this.cache.get<string[]>(blockedKey);
    if (!blockedIds) {
      blockedIds = await this.blockService.getBlockedUserIds(userId);
      await this.cache.set(blockedKey, blockedIds, 300_000);
    }

    const users = await this.findFeedCandidates(me, blockedIds, filters);

    const scored = this.scoreAndFilterCandidates(me, users, filters)
      .sort(
        (a, b) => b.recommendationScore - a.recommendationScore,
      )
      .slice(0, DISCOVERY_FEED_RESULT_LIMIT);

    // Cache feed results (2 min)
    await this.cache.set(cacheKey, scored, 120_000);

    this.logger.debug(
      asLogMessage('discovery.feed.generated', {
        userId,
        blockedCount: blockedIds.length,
        candidateCount: users.length,
        returnedCount: scored.length,
        filters: {
          hasDistanceKm: typeof filters.distanceKm === 'number',
          hasMinAge: typeof filters.minAge === 'number',
          hasMaxAge: typeof filters.maxAge === 'number',
          goalsCount: filters.goals?.length ?? 0,
          intensityCount: filters.intensity?.length ?? 0,
          availabilityCount: filters.availability?.length ?? 0,
        },
      }),
    );

    return scored;
  }

  async invalidateUserFeedCache(userId: string): Promise<void> {
    const store = (this.cache as { store?: { keys?: (pattern: string) => Promise<string[]> } }).store;
    if (store && typeof store.keys === 'function') {
      const feedKeys = await store.keys(`feed:${userId}:*`);
      await Promise.all([
        this.cache.del(this.blockedCacheKey(userId)),
        ...feedKeys.map((key) => this.cache.del(key)),
      ]);
    } else {
      this.logger.warn(
        asLogMessage('discovery.cache.store_keys_unavailable', {
          userId,
          hint: 'feed entries may be stale until TTL expires',
        }),
      );
      await this.cache.del(this.blockedCacheKey(userId));
    }
  }

  private async getRequesterOrThrow(userId: string): Promise<DiscoveryRequester> {
    const requester = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        gender: true,
        profile: {
          select: {
            latitude: true,
            longitude: true,
            showMeMen: true,
            showMeWomen: true,
          },
        },
        fitnessProfile: {
          select: {
            primaryGoal: true,
            secondaryGoal: true,
            intensityLevel: true,
          },
        },
      },
    });

    if (!requester) {
      this.logger.warn(
        asLogMessage('discovery.feed.user_missing', {
          userId,
        }),
      );
      throw new NotFoundException('User not found');
    }

    const legacyRequester = requester as typeof requester & {
      showMeMen?: boolean;
      showMeWomen?: boolean;
    };

    return {
      ...requester,
      showMeMen:
        requester.profile?.showMeMen ?? legacyRequester.showMeMen ?? true,
      showMeWomen:
        requester.profile?.showMeWomen ?? legacyRequester.showMeWomen ?? true,
    };
  }

  private async findFeedCandidates(
    requester: DiscoveryRequester,
    blockedIds: string[],
    filters: DiscoveryFilters,
  ): Promise<UserWithRelations[]> {
    return this.prisma.user.findMany({
      where: this.buildFeedQuery(requester, blockedIds, filters),
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
            intentDating: true,
            intentWorkout: true,
            intentFriends: true,
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
      orderBy: { id: 'asc' },
      take: DISCOVERY_FEED_QUERY_LIMIT,
    });
  }

  private buildFeedQuery(
    requester: DiscoveryRequester,
    blockedIds: string[],
    filters: DiscoveryFilters,
  ) {
    const birthdateFilter = this.buildBirthdateFilter(filters);
    const fitnessProfileFilter = this.buildFitnessProfileFilter(filters);
    const genderFilter = this.buildGenderPreferenceFilter(requester);

    return {
      id: { notIn: [requester.id, ...blockedIds] },
      isDeleted: false,
      isBanned: false,
      isOnboarded: true,
      receivedLikes: { none: { fromUserId: requester.id } },
      receivedPasses: { none: { fromUserId: requester.id } },
      ...(genderFilter ? { gender: genderFilter } : {}),
      ...(birthdateFilter ? { birthdate: birthdateFilter } : {}),
      ...(fitnessProfileFilter
        ? {
            fitnessProfile: {
              is: fitnessProfileFilter,
            },
          }
        : {}),
    };
  }

  private buildGenderPreferenceFilter(requester: DiscoveryRequester) {
    const genders: Gender[] = [];

    if (requester.showMeMen !== false) {
      genders.push(Gender.MALE);
    }

    if (requester.showMeWomen !== false) {
      genders.push(Gender.FEMALE);
    }

    if (genders.length === 0) {
      throw new BadRequestException('Choose at least one discovery preference');
    }

    return { in: genders };
  }

  private scoreAndFilterCandidates(
    requester: DiscoveryRequester,
    users: UserWithRelations[],
    filters: DiscoveryFilters,
  ): DiscoveryFeedEntry[] {
    const maxDistanceKm = this.getValidDistanceFilter(filters.distanceKm);
    const requesterHasCoordinates = this.hasCoordinates(
      requester.profile?.latitude,
      requester.profile?.longitude,
    );
    const scoringRequester = this.createScoringRequester(requester);

    return users.reduce<DiscoveryFeedEntry[]>((results, user) => {
      const age = calculateAge(user.birthdate) ?? 0;
      const distanceKm = this.calculateDistanceKm(
        requester.profile?.latitude,
        requester.profile?.longitude,
        user.profile?.latitude,
        user.profile?.longitude,
      );

      if (
        this.shouldExcludeCandidate(
          age,
          distanceKm,
          filters,
          maxDistanceKm,
          requesterHasCoordinates,
        )
      ) {
        return results;
      }

      const recommendationScore = this.computeRecommendationScore(
        scoringRequester,
        user,
        age,
        distanceKm,
      );

      results.push(
        this.sanitizeDiscoveryCandidate(
          user,
          age,
          distanceKm,
          recommendationScore,
        ),
      );
      return results;
    }, []);
  }

  private shouldExcludeCandidate(
    age: number,
    distanceKm: number | null,
    filters: DiscoveryFilters,
    maxDistanceKm: number | null,
    requesterHasCoordinates: boolean,
  ) {
    if (typeof filters.minAge === 'number' && age < filters.minAge) {
      return true;
    }

    if (typeof filters.maxAge === 'number' && age > filters.maxAge) {
      return true;
    }

    return (
      maxDistanceKm !== null &&
      requesterHasCoordinates &&
      (distanceKm === null || distanceKm > maxDistanceKm)
    );
  }

  private createScoringRequester(requester: DiscoveryRequester) {
    return {
      fitnessProfile: requester.fitnessProfile
        ? {
            intensityLevel: requester.fitnessProfile.intensityLevel,
            primaryGoal: requester.fitnessProfile.primaryGoal,
            secondaryGoal: requester.fitnessProfile.secondaryGoal,
          }
        : null,
    };
  }

  private sanitizeDiscoveryCandidate(
    user: UserWithRelations,
    age: number,
    distanceKm: number | null,
    recommendationScore: number,
  ): DiscoveryFeedEntry {
    const { profile, ...userWithoutProfile } = user;

    return {
      ...userWithoutProfile,
      profile: {
        city: profile?.city ?? null,
        bio: profile?.bio ?? null,
        intentDating: profile?.intentDating ?? null,
        intentWorkout: profile?.intentWorkout ?? null,
        intentFriends: profile?.intentFriends ?? null,
      },
      age,
      distanceKm,
      recommendationScore,
    };
  }

  private getValidDistanceFilter(distanceKm?: number) {
    if (
      typeof distanceKm === 'number' &&
      Number.isFinite(distanceKm) &&
      distanceKm > 0
    ) {
      return distanceKm;
    }

    return null;
  }

  private hasCoordinates(
    latitude?: number | null,
    longitude?: number | null,
  ): boolean {
    return (
      latitude !== null &&
      latitude !== undefined &&
      longitude !== null &&
      longitude !== undefined
    );
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

  private normalizeGoals(goals: Array<string | null | undefined>) {
    return goals
      .filter(Boolean)
      .map((goal) => String(goal).toLowerCase());
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

    const candidateGoals = this.normalizeGoals([
      candidate.fitnessProfile?.primaryGoal,
      candidate.fitnessProfile?.secondaryGoal,
    ]);
    const myGoals = this.normalizeGoals([
      me?.fitnessProfile?.primaryGoal,
      me?.fitnessProfile?.secondaryGoal,
    ]);

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
      this.logger.warn(
        asLogMessage('discovery.like.rejected_self', {
          userId,
          targetUserId,
        }),
      );
      throw new BadRequestException('Cannot like yourself');
    }

    await this.assertSwipeTargetAvailable(userId, targetUserId);

    if (await this.blockService.isBlocked(userId, targetUserId)) {
      throw new ForbiddenException('This user is no longer available');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      return this.createLikeResult(tx, userId, targetUserId);
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

    await this.invalidateUserFeedCache(userId);
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

    await this.assertSwipeTargetAvailable(userId, targetUserId);

    if (await this.blockService.isBlocked(userId, targetUserId)) {
      throw new ForbiddenException('This user is no longer available');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      return this.createPassResult(tx, userId, targetUserId);
    });

    this.logger.debug(
      asLogMessage('discovery.pass.completed', {
        userId,
        targetUserId,
        outcome: result.status,
      }),
    );

    await this.invalidateUserFeedCache(userId);
    return result;
  }

  async undoLastSwipe(userId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const lastSwipe = await this.findLastSwipe(tx, userId);

      if (!lastSwipe) {
        return { status: 'nothing_to_undo' as const };
      }

      if (lastSwipe.action === 'like') {
        const lastLike = lastSwipe.record;
        await tx.like.delete({ where: { id: lastLike.id } });
        const archivedMatchId = await this.archiveMatchForUndo(
          tx,
          userId,
          lastLike.toUserId,
        );

        return {
          status: 'undone' as const,
          action: 'like' as const,
          targetUserId: lastLike.toUserId,
          ...(archivedMatchId ? { archivedMatchId } : {}),
        };
      }

      await tx.pass.delete({ where: { id: lastSwipe.record.id } });
      return {
        status: 'undone' as const,
        action: 'pass' as const,
        targetUserId: lastSwipe.record.toUserId,
      };
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

  private async assertTargetUserExists(targetUserId: string) {
    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId, isDeleted: false, isBanned: false },
      select: { id: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }
  }

  private async assertSwipeTargetAvailable(userId: string, targetUserId: string) {
    if (await this.blockService.isBlocked(userId, targetUserId)) {
      throw new NotFoundException('User not found');
    }

    await this.assertTargetUserExists(targetUserId);
  }

  private async createLikeResult(
    tx: DiscoveryTransaction,
    userId: string,
    targetUserId: string,
  ) {
    const existingLike = await tx.like.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: userId,
          toUserId: targetUserId,
        },
      },
    });

    if (existingLike) {
      return { status: 'already_liked' as const };
    }

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

    if (!mutualLike) {
      return { status: 'liked' as const };
    }

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

  private async createPassResult(
    tx: DiscoveryTransaction,
    userId: string,
    targetUserId: string,
  ) {
    const existingPass = await tx.pass.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: userId,
          toUserId: targetUserId,
        },
      },
    });

    if (existingPass) {
      return { status: 'already_passed' as const };
    }

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
  }

  private async findLastSwipe(tx: DiscoveryTransaction, userId: string) {
    // Prisma interactive transactions do not support parallel queries;
    // run them sequentially to avoid runtime errors.
    const lastLike = await tx.like.findFirst({
      where: { fromUserId: userId },
      orderBy: { createdAt: 'desc' },
    }) as SwipeRecord | null;
    const lastPass = await tx.pass.findFirst({
      where: { fromUserId: userId },
      orderBy: { createdAt: 'desc' },
    }) as SwipeRecord | null;

    if (!lastLike && !lastPass) {
      return null;
    }

    if (lastLike && (!lastPass || lastLike.createdAt >= lastPass.createdAt)) {
      return {
        action: 'like' as const,
        record: lastLike,
      };
    }

    if (lastPass) {
      return {
        action: 'pass' as const,
        record: lastPass,
      };
    }

    return null;
  }

  private async archiveMatchForUndo(
    tx: DiscoveryTransaction,
    userId: string,
    targetUserId: string,
  ) {
    const [userAId, userBId] = [userId, targetUserId].sort();
    const existingMatch = await tx.match.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
    });

    if (!existingMatch || existingMatch.isArchived) {
      return undefined;
    }

    await tx.match.update({
      where: { id: existingMatch.id },
      data: { isArchived: true },
    });

    return existingMatch.id;
  }

}
