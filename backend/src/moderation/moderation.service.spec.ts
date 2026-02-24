import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const reportCreate = jest.fn();
const matchFindUnique = jest.fn();
const matchUpdate = jest.fn();
const notificationsCreate = jest.fn();

const prisma = {
  report: { create: reportCreate },
  match: { findUnique: matchFindUnique, update: matchUpdate },
} as unknown as PrismaService;

const notifications = {
  create: notificationsCreate,
} as unknown as NotificationsService;

describe('ModerationService', () => {
  let service: ModerationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ModerationService(prisma, notifications);
  });

  // ── reportUser ──────────────────────────────────────────────────────────────

  describe('reportUser', () => {
    it('throws BadRequest when reporter === reported', async () => {
      await expect(
        service.reportUser('user-1', {
          reportedUserId: 'user-1',
          category: 'spam',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws Forbidden when matchId provided but user is not a participant', async () => {
      matchFindUnique.mockResolvedValue({
        id: 'match-1',
        userAId: 'user-x',
        userBId: 'user-y',
      });

      await expect(
        service.reportUser('user-1', {
          reportedUserId: 'user-2',
          category: 'spam',
          matchId: 'match-1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates a report and fires notification when valid', async () => {
      matchFindUnique.mockResolvedValue({
        id: 'match-1',
        userAId: 'user-1',
        userBId: 'user-2',
      });
      reportCreate.mockResolvedValue({ id: 'report-1', status: 'open' });

      const result = await service.reportUser('user-1', {
        reportedUserId: 'user-2',
        category: 'harassment',
        matchId: 'match-1',
      });

      expect(result).toMatchObject({ id: 'report-1', status: 'open' });
      expect(notificationsCreate).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ type: 'system', title: 'Report submitted' }),
      );
    });

    it('creates a report with no matchId (e.g. from discovery)', async () => {
      reportCreate.mockResolvedValue({ id: 'report-2', status: 'open' });

      const result = await service.reportUser('user-1', {
        reportedUserId: 'user-3',
        category: 'spam',
      });

      expect(result).toMatchObject({ id: 'report-2' });
      expect(matchFindUnique).not.toHaveBeenCalled();
    });
  });

  // ── blockUser ───────────────────────────────────────────────────────────────

  describe('blockUser', () => {
    it('throws BadRequest when actor === target', async () => {
      await expect(service.blockUser('user-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('blocks and archives existing match', async () => {
      matchFindUnique.mockResolvedValue({
        id: 'match-1',
        userAId: 'user-1',
        userBId: 'user-2',
      });
      matchUpdate.mockResolvedValue({ id: 'match-1' });

      const result = await service.blockUser('user-1', 'user-2');

      expect(result).toEqual({ success: true, matchId: 'match-1' });
      expect(matchUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'match-1' },
          data: { isBlocked: true, isArchived: true },
        }),
      );
      expect(notificationsCreate).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ type: 'system', title: 'User blocked' }),
      );
    });

    it('records a block-report when no match exists (block from discovery)', async () => {
      matchFindUnique.mockResolvedValue(null);
      reportCreate.mockResolvedValue({ id: 'report-3' });

      const result = await service.blockUser('user-1', 'user-99');

      expect(result).toEqual({ success: true, matchId: null });
      expect(reportCreate).toHaveBeenCalledTimes(1);
      expect(matchUpdate).not.toHaveBeenCalled();
      expect(notificationsCreate).toHaveBeenCalled();
    });
  });
});
