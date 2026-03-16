import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ReportCategory, ReportStatus } from '@prisma/client';

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async reportUser(
    reporterId: string,
    payload: {
      reportedUserId: string;
      category: ReportCategory;
      description?: string;
      matchId?: string;
    },
  ) {
    if (reporterId === payload.reportedUserId) {
      throw new BadRequestException('Cannot report yourself');
    }

    if (payload.matchId) {
      const match = await this.prisma.match.findUnique({
        where: { id: payload.matchId },
      });
      if (
        !match ||
        (match.userAId !== reporterId && match.userBId !== reporterId)
      ) {
        throw new ForbiddenException('Match access denied');
      }
    }

    const report = await this.prisma.report.create({
      data: {
        reporterId,
        reportedUserId: payload.reportedUserId,
        matchId: payload.matchId,
        category: payload.category,
        description: payload.description,
        status: ReportStatus.PENDING,
      },
    });

    // Moderation hook: notify moderation inbox (future queue/webhook)
    void this.notifications.create(reporterId, {
      type: 'system',
      title: 'Report submitted',
      body: 'Thanks. Our team will review this report.',
      data: { reportId: report.id },
    });

    return report;
  }

  async blockUser(actorId: string, targetUserId: string) {
    if (actorId === targetUserId) {
      throw new BadRequestException('Cannot block yourself');
    }

    const [userAId, userBId] = [actorId, targetUserId].sort();
    const match = await this.prisma.match.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
    });

    let matchId: string | null = null;
    if (match) {
      // Block and archive an existing match conversation
      const updated = await this.prisma.match.update({
        where: { id: match.id },
        data: { isBlocked: true, isArchived: true },
      });
      matchId = updated.id;
    } else {
      // No match exists (e.g. block from discovery): record a block-report
      // so the block is persistent and queryable by the moderation pipeline.
      await this.prisma.report.create({
        data: {
          reporterId: actorId,
          reportedUserId: targetUserId,
          category: ReportCategory.BLOCK,
          status: ReportStatus.PENDING,
        },
      });
    }

    void this.notifications.create(actorId, {
      type: 'system',
      title: 'User blocked',
      body: 'You will no longer see this person.',
      data: { matchId, targetUserId },
    });

    return { success: true, matchId };
  }
}
