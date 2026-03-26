import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ReportCategory, ReportStatus } from '@prisma/client';
import { NotificationType } from '../common/enums';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async getActiveTargetUser(targetUserId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        isDeleted: false,
        isBanned: false,
      },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

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

    await this.getActiveTargetUser(payload.reportedUserId);

    if (payload.matchId) {
      const match = await this.prisma.match.findUnique({
        where: { id: payload.matchId },
        select: {
          id: true,
          userAId: true,
          userBId: true,
        },
      });
      if (
        !match ||
        (match.userAId !== reporterId && match.userBId !== reporterId)
      ) {
        throw new ForbiddenException('Match access denied');
      }

      const expectedReportedUserId =
        match.userAId === reporterId ? match.userBId : match.userAId;
      if (expectedReportedUserId !== payload.reportedUserId) {
        throw new ForbiddenException('Reported user must be the other match participant');
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
    void this.notifications
      .create(reporterId, {
        type: NotificationType.System,
        title: 'Report submitted',
        body: 'Thanks. Our team will review this report.',
        data: { reportId: report.id },
      })
      .catch((err) => this.logger.error('Failed to send notification', err));

    return report;
  }

  async blockUser(actorId: string, targetUserId: string) {
    if (actorId === targetUserId) {
      throw new BadRequestException('Cannot block yourself');
    }

    await this.getActiveTargetUser(targetUserId);

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

    // Create reciprocal passes so both users are excluded from discovery.
    await Promise.all([
      this.prisma.pass.upsert({
        where: {
          fromUserId_toUserId: {
            fromUserId: actorId,
            toUserId: targetUserId,
          },
        },
        update: {},
        create: { fromUserId: actorId, toUserId: targetUserId },
      }),
      this.prisma.pass.upsert({
        where: {
          fromUserId_toUserId: {
            fromUserId: targetUserId,
            toUserId: actorId,
          },
        },
        update: {},
        create: { fromUserId: targetUserId, toUserId: actorId },
      }),
    ]);

    void this.notifications
      .create(actorId, {
        type: NotificationType.System,
        title: 'User blocked',
        body: 'You will no longer see this person.',
        data: { matchId, targetUserId },
      })
      .catch((err) => this.logger.error('Failed to send notification', err));

    return { success: true, matchId };
  }
}
