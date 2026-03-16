import { ForbiddenException, Injectable, MessageEvent } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MatchesRealtimeService } from './matches-realtime.service';
import { map, Observable } from 'rxjs';
import { NotificationsService } from '../notifications/notifications.service';
import { deriveMatchClassification } from './match-classification';

function isUniqueConstraintError(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    return true;
  }

  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private realtime: MatchesRealtimeService,
    private readonly notifications: NotificationsService,
  ) {}

  async likeUser(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) {
      return { isMatch: false };
    }
    // 1. Check if like already exists to prevent duplicates
    const existingLike = await this.prisma.like.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId,
          toUserId,
        },
      },
    });

    if (existingLike) {
      return { isMatch: false, alreadyLiked: true };
    }

    // 2. Create the like
    await this.prisma.like.create({
      data: {
        fromUserId,
        toUserId,
      },
    });

    // 3. Check for mutual like
    const mutualLike = await this.prisma.like.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: toUserId,
          toUserId: fromUserId,
        },
      },
    });

    if (mutualLike) {
      // 4. Create Match
      // Ensure consistent ordering for unique constraint
      const [userAId, userBId] = [fromUserId, toUserId].sort();

      // Check if match already exists (edge case)
      const existingMatch = await this.prisma.match.findUnique({
        where: {
          userAId_userBId: {
            userAId,
            userBId,
          },
        },
      });

      if (existingMatch) {
        return { isMatch: true, matchId: existingMatch.id };
      }

      const classification = await deriveMatchClassification(this.prisma, [
        fromUserId,
        toUserId,
      ]);

      let match: { id: string };
      try {
        match = await this.prisma.match.create({
          data: {
            userAId,
            userBId,
            ...classification,
          },
        });
      } catch (e) {
        // Race condition: both users liked simultaneously; another request created the match first
        if (isUniqueConstraintError(e)) {
          const existing = await this.prisma.match.findUnique({
            where: { userAId_userBId: { userAId, userBId } },
          });
          if (existing) {
            return { isMatch: true, matchId: existing.id };
          }
        }
        throw e;
      }

      this.notifications.create(fromUserId, {
        type: 'match_created',
        title: "It's a match!",
        body: 'You both liked each other.',
        data: { matchId: match.id },
      });
      this.notifications.create(toUserId, {
        type: 'match_created',
        title: "It's a match!",
        body: 'You both liked each other.',
        data: { matchId: match.id },
      });

      return { isMatch: true, matchId: match.id };
    }

    return { isMatch: false };
  }

  async getMatches(userId: string, take = 20, skip = 0) {
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        isBlocked: false,
        isArchived: false,
      },
      include: {
        userA: {
          include: {
            profile: true,
            photos: { where: { isPrimary: true } },
          },
        },
        userB: {
          include: {
            profile: true,
            photos: { where: { isPrimary: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take,
      skip,
    });

    // Transform to return the *other* user
    return matches.map((match) => {
      const isUserA = match.userAId === userId;
      const otherUser = isUserA ? match.userB : match.userA;
      return {
        id: match.id,
        createdAt: match.createdAt,
        user: {
          id: otherUser.id,
          firstName: otherUser.firstName,
          photoUrl: otherUser.photos[0]?.storageKey,
        },
        lastMessage: match.messages[0]?.body,
      };
    });
  }
  async getMessages(matchId: string, userId: string) {
    await this.assertMatchAccess(matchId, userId);

    const messages = await this.prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return messages.reverse().map((msg) => ({
      id: msg.id,
      text: msg.body,
      sender: msg.senderId === userId ? 'me' : 'them',
      timestamp: msg.createdAt,
    }));
  }

  async streamMessages(
    matchId: string,
    userId: string,
  ): Promise<Observable<MessageEvent>> {
    await this.assertMatchAccess(matchId, userId);

    return this.realtime
      .stream(matchId)
      .pipe(
        map(
          (event) => ({ type: event.type, data: event }) satisfies MessageEvent,
        ),
      );
  }

  async sendMessage(matchId: string, userId: string, content: string) {
    const match = await this.assertMatchAccess(matchId, userId);

    const message = await this.prisma.message.create({
      data: {
        matchId,
        senderId: userId,
        body: content,
      },
    });

    // Update match timestamp
    await this.prisma.match.update({
      where: { id: matchId },
      data: { updatedAt: new Date() },
    });

    const response = {
      id: message.id,
      text: message.body ?? '',
      sender: 'me' as const,
      timestamp: message.createdAt,
    };

    this.realtime.publishMessage(matchId, response);

    const recipientId =
      match.userAId === userId ? match.userBId : match.userAId;
    this.notifications.create(recipientId, {
      type: 'message_received',
      title: 'New message',
      body: content,
      data: { matchId, senderId: userId },
    });

    return response;
  }

  private async assertMatchAccess(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (
      !match ||
      (match.userAId !== userId && match.userBId !== userId) ||
      match.isBlocked ||
      match.isArchived
    ) {
      throw new ForbiddenException('Access denied');
    }

    return match;
  }
}
