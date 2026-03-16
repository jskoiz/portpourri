/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument */
import { ForbiddenException } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { PrismaService } from '../prisma/prisma.service';
import { MatchesRealtimeService } from './matches-realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { firstValueFrom, of } from 'rxjs';

describe('MatchesService realtime', () => {
  let service: MatchesService;

  const prisma = {
    userProfile: {
      findMany: jest.fn(),
    },
    like: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    match: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  } as unknown as PrismaService;

  const realtime = {
    publishMessage: jest.fn(),
    stream: jest.fn(),
  } as unknown as MatchesRealtimeService;

  const notifications = {
    create: jest.fn(),
  } as unknown as NotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(prisma.userProfile.findMany).mockResolvedValue([] as any);
    service = new MatchesService(prisma, realtime, notifications);
  });

  it('publishes realtime event when sending a message', async () => {
    const now = new Date('2026-02-20T10:00:00.000Z');

    jest.mocked(prisma.match.findUnique).mockResolvedValue({
      id: 'match-1',
      userAId: 'user-1',
      userBId: 'user-2',
    } as any);
    jest.mocked(prisma.message.create).mockResolvedValue({
      id: 'msg-1',
      body: 'hey',
      createdAt: now,
    } as any);
    jest.mocked(prisma.match.update).mockResolvedValue({} as any);

    const result = await service.sendMessage('match-1', 'user-1', 'hey');

    expect(result).toEqual({
      id: 'msg-1',
      text: 'hey',
      sender: 'me',
      timestamp: now,
    });
    expect(jest.mocked(realtime.publishMessage)).toHaveBeenCalledWith(
      'match-1',
      result,
    );
  });

  it('maps stream events to SSE payload', async () => {
    const event = {
      type: 'message' as const,
      matchId: 'match-1',
      message: {
        id: 'msg-2',
        text: 'yo',
        sender: 'them' as const,
        timestamp: new Date('2026-02-20T11:00:00.000Z'),
      },
    };

    jest.mocked(prisma.match.findUnique).mockResolvedValue({
      id: 'match-1',
      userAId: 'user-1',
      userBId: 'user-2',
    } as any);
    jest.mocked(realtime.stream).mockReturnValue(of(event));

    const stream$ = await service.streamMessages('match-1', 'user-1');
    const packet = await firstValueFrom(stream$);

    expect(packet).toEqual({
      type: 'message',
      data: event,
    });
  });

  it('rejects message reads for users outside the match with a forbidden error', async () => {
    jest.mocked(prisma.match.findUnique).mockResolvedValue({
      id: 'match-1',
      userAId: 'user-1',
      userBId: 'user-2',
      isBlocked: false,
    } as any);

    await expect(service.getMessages('match-1', 'user-3')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(jest.mocked(prisma.message.findMany)).not.toHaveBeenCalled();
  });

  it('rejects message sends for blocked matches with a forbidden error', async () => {
    jest.mocked(prisma.match.findUnique).mockResolvedValue({
      id: 'match-1',
      userAId: 'user-1',
      userBId: 'user-2',
      isBlocked: true,
    } as any);

    await expect(
      service.sendMessage('match-1', 'user-1', 'hey'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(jest.mocked(prisma.message.create)).not.toHaveBeenCalled();
  });

  it('returns messages in ascending chronological order', async () => {
    const older = {
      id: 'msg-1',
      body: 'first',
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      senderId: 'user-2',
    };
    const newer = {
      id: 'msg-2',
      body: 'second',
      createdAt: new Date('2026-01-01T11:00:00.000Z'),
      senderId: 'user-1',
    };

    jest.mocked(prisma.match.findUnique).mockResolvedValue({
      id: 'match-1',
      userAId: 'user-1',
      userBId: 'user-2',
      isBlocked: false,
    } as any);
    jest.mocked(prisma.message.findMany).mockResolvedValue([newer, older] as any);

    const messages = await service.getMessages('match-1', 'user-1');

    expect(messages).toHaveLength(2);
    expect(messages[0].id).toBe('msg-1');
    expect(messages[1].id).toBe('msg-2');
  });

  it.each([
    {
      label: 'message reads',
      call: () => service.getMessages('match-1', 'user-1'),
      assertNoSideEffect: () =>
        expect(jest.mocked(prisma.message.findMany)).not.toHaveBeenCalled(),
    },
    {
      label: 'message streaming',
      call: () => service.streamMessages('match-1', 'user-1'),
      assertNoSideEffect: () =>
        expect(jest.mocked(realtime.stream)).not.toHaveBeenCalled(),
    },
    {
      label: 'message sends',
      call: () => service.sendMessage('match-1', 'user-1', 'hey'),
      assertNoSideEffect: () =>
        expect(jest.mocked(prisma.message.create)).not.toHaveBeenCalled(),
    },
  ])(
    'rejects $label for archived matches with a forbidden error',
    async ({ call, assertNoSideEffect }) => {
      jest.mocked(prisma.match.findUnique).mockResolvedValue({
        id: 'match-1',
        userAId: 'user-1',
        userBId: 'user-2',
        isBlocked: false,
        isArchived: true,
      } as any);

      await expect(call()).rejects.toBeInstanceOf(ForbiddenException);
      assertNoSideEffect();
    },
  );
});
