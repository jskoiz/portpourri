import { Injectable, MessageEvent } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchesRealtimeService } from './matches-realtime.service';
import { map, Observable } from 'rxjs';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private realtime: MatchesRealtimeService,
    private readonly notifications: NotificationsService,
  ) {}

  async likeUser(fromUserId: string, toUserId: string) {
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

      const match = await this.prisma.match.create({
        data: {
          userAId,
          userBId,
          isDatingMatch: true, // Defaulting to dating for now
        },
      });

      return { isMatch: true, matchId: match.id };
    }

    return { isMatch: false };
  }

  async getMatches(userId: string) {
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
    // Verify user is part of match
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (
      !match ||
      (match.userAId !== userId && match.userBId !== userId) ||
      match.isBlocked
    ) {
      throw new Error('Access denied');
    }

    const messages = await this.prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return messages.map((msg) => ({
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
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (
      !match ||
      (match.userAId !== userId && match.userBId !== userId) ||
      match.isBlocked
    ) {
      throw new Error('Access denied');
    }

    return this.realtime
      .stream(matchId)
      .pipe(
        map(
          (event) => ({ type: event.type, data: event }) satisfies MessageEvent,
        ),
      );
  }

  async sendMessage(matchId: string, userId: string, content: string) {
    // Verify user is part of match
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (
      !match ||
      (match.userAId !== userId && match.userBId !== userId) ||
      match.isBlocked
    ) {
      throw new Error('Access denied');
    }

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
}
