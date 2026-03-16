import { ForbiddenException, Injectable, Logger, MessageEvent } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchesRealtimeService } from './matches-realtime.service';
import { map, Observable } from 'rxjs';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: MatchesRealtimeService,
    private readonly notifications: NotificationsService,
  ) {}

  async getMatches(userId: string, take: number, skip: number) {
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        isBlocked: false,
        isArchived: false,
      },
      select: {
        id: true,
        createdAt: true,
        userAId: true,
        userBId: true,
        userA: {
          select: {
            id: true,
            firstName: true,
            isDeleted: true,
            isBanned: true,
            photos: {
              where: { isPrimary: true },
              select: { storageKey: true },
              take: 1,
            },
          },
        },
        userB: {
          select: {
            id: true,
            firstName: true,
            isDeleted: true,
            isBanned: true,
            photos: {
              where: { isPrimary: true },
              select: { storageKey: true },
              take: 1,
            },
          },
        },
        messages: {
          select: { body: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take,
      skip,
    });

    // Transform to return the *other* user, filtering out deleted/banned users
    return matches
      .filter((match) => {
        const otherUser = match.userAId === userId ? match.userB : match.userA;
        return !otherUser.isDeleted && !otherUser.isBanned;
      })
      .map((match) => {
        const isUserA = match.userAId === userId;
        const otherUser = isUserA ? match.userB : match.userA;
        return {
          id: match.id,
          createdAt: match.createdAt,
          user: {
            id: otherUser.id,
            firstName: otherUser.firstName,
            photoUrl: otherUser.photos[0]?.storageKey ?? null,
          },
          lastMessage: match.messages[0]?.body ?? null,
        };
      });
  }
  async getMessages(matchId: string, userId: string, take = 50, skip = 0) {
    await this.assertMatchAccess(matchId, userId);

    const messages = await this.prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(take, 100),
      skip,
      select: {
        id: true,
        body: true,
        senderId: true,
        createdAt: true,
      },
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
    void this.notifications.create(recipientId, {
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
      select: {
        id: true,
        userAId: true,
        userBId: true,
        isBlocked: true,
        isArchived: true,
      },
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
