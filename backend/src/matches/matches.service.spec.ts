/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument */
import { MatchesService } from './matches.service';
import { PrismaService } from '../prisma/prisma.service';
import { MatchesRealtimeService } from './matches-realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { firstValueFrom, of } from 'rxjs';

describe('MatchesService realtime', () => {
  let service: MatchesService;

  const prisma = {
    match: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    message: {
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
});
