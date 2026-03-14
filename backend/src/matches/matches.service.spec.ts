/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument */
import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  it('sends match notifications to both users on mutual like', async () => {
    jest
      .mocked(prisma.like.findUnique)
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce({ id: 'like-2' } as any);
    jest.mocked(prisma.like.create).mockResolvedValue({ id: 'like-1' } as any);
    jest.mocked(prisma.match.findUnique).mockResolvedValue(null as any);
    jest.mocked(prisma.userProfile.findMany).mockResolvedValue([
      { userId: 'user-1', intentDating: true, intentWorkout: false },
      { userId: 'user-2', intentDating: true, intentWorkout: false },
    ] as any);
    jest.mocked(prisma.match.create).mockResolvedValue({ id: 'match-1' } as any);

    await service.likeUser('user-1', 'user-2');

    expect(jest.mocked(notifications.create)).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ type: 'match_created' }),
    );
    expect(jest.mocked(notifications.create)).toHaveBeenCalledWith(
      'user-2',
      expect.objectContaining({ type: 'match_created' }),
    );
  });

  it('creates a mutual-like match using shared profile intents', async () => {
    jest
      .mocked(prisma.like.findUnique)
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce({ id: 'like-2' } as any);
    jest.mocked(prisma.like.create).mockResolvedValue({ id: 'like-1' } as any);
    jest.mocked(prisma.match.findUnique).mockResolvedValue(null as any);
    jest.mocked(prisma.userProfile.findMany).mockResolvedValue([
      {
        userId: 'user-1',
        intentDating: false,
        intentWorkout: true,
      },
      {
        userId: 'user-2',
        intentDating: true,
        intentWorkout: true,
      },
    ] as any);
    jest
      .mocked(prisma.match.create)
      .mockResolvedValue({ id: 'match-1' } as any);

    const result = await service.likeUser('user-1', 'user-2');

    expect(result).toEqual({ isMatch: true, matchId: 'match-1' });
    expect(jest.mocked(prisma.match.create)).toHaveBeenCalledWith({
      data: {
        userAId: 'user-1',
        userBId: 'user-2',
        isDatingMatch: false,
        isWorkoutMatch: true,
      },
    });
  });

  it('handles race condition on simultaneous mutual likes by returning existing match', async () => {
    jest
      .mocked(prisma.like.findUnique)
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce({ id: 'like-2' } as any);
    jest.mocked(prisma.like.create).mockResolvedValue({ id: 'like-1' } as any);
    // First findUnique (existing match check) returns null
    jest.mocked(prisma.match.findUnique)
      .mockResolvedValueOnce(null as any)
      // Second findUnique (recovery after P2002) returns the race-created match
      .mockResolvedValueOnce({ id: 'match-race' } as any);
    jest.mocked(prisma.userProfile.findMany).mockResolvedValue([
      { userId: 'user-1', intentDating: true, intentWorkout: false },
      { userId: 'user-2', intentDating: true, intentWorkout: false },
    ] as any);

    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '0.0.0',
    });
    jest.mocked(prisma.match.create).mockRejectedValue(p2002);

    const result = await service.likeUser('user-1', 'user-2');

    expect(result).toEqual({ isMatch: true, matchId: 'match-race' });
    // Notifications should NOT be sent since this process didn't create the match
    expect(jest.mocked(notifications.create)).not.toHaveBeenCalled();
  });

  it('rejects message access for archived matches with a forbidden error', async () => {
    jest.mocked(prisma.match.findUnique).mockResolvedValue({
      id: 'match-1',
      userAId: 'user-1',
      userBId: 'user-2',
      isBlocked: false,
      isArchived: true,
    } as any);

    await expect(service.getMessages('match-1', 'user-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(jest.mocked(prisma.message.findMany)).not.toHaveBeenCalled();
  });

  it('rejects a self-like without creating any DB records', async () => {
    const result = await service.likeUser('user-1', 'user-1');

    expect(result).toEqual({ isMatch: false });
    expect(jest.mocked(prisma.like.findUnique)).not.toHaveBeenCalled();
    expect(jest.mocked(prisma.like.create)).not.toHaveBeenCalled();
    expect(jest.mocked(prisma.match.create)).not.toHaveBeenCalled();
  });

  it('falls back to a dating match when profile intent data is unavailable', async () => {
    jest
      .mocked(prisma.like.findUnique)
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce({ id: 'like-2' } as any);
    jest.mocked(prisma.like.create).mockResolvedValue({ id: 'like-1' } as any);
    jest.mocked(prisma.match.findUnique).mockResolvedValue(null as any);
    jest.mocked(prisma.userProfile.findMany).mockResolvedValue([
      {
        userId: 'user-1',
        intentDating: false,
        intentWorkout: true,
      },
    ] as any);
    jest
      .mocked(prisma.match.create)
      .mockResolvedValue({ id: 'match-2' } as any);

    await service.likeUser('user-1', 'user-2');

    expect(jest.mocked(prisma.match.create)).toHaveBeenCalledWith({
      data: {
        userAId: 'user-1',
        userBId: 'user-2',
        isDatingMatch: true,
        isWorkoutMatch: false,
      },
    });
  });

  it('handles concurrent mutual like race condition gracefully', async () => {
    // Both users like each other simultaneously. match.create throws a unique
    // constraint error (simulating the race), and the service should recover by
    // fetching the already-created match instead of surfacing a 500.
    jest
      .mocked(prisma.like.findUnique)
      .mockResolvedValueOnce(null as any) // existingLike check: no prior like
      .mockResolvedValueOnce({ id: 'like-2' } as any); // mutual like exists
    jest.mocked(prisma.like.create).mockResolvedValue({ id: 'like-1' } as any);
    jest
      .mocked(prisma.match.findUnique)
      .mockResolvedValueOnce(null as any) // existingMatch check: no match yet
      .mockResolvedValueOnce({ id: 'match-race' } as any); // recovery fetch after error
    jest.mocked(prisma.userProfile.findMany).mockResolvedValue([
      { userId: 'user-1', intentDating: true, intentWorkout: false },
      { userId: 'user-2', intentDating: true, intentWorkout: false },
    ] as any);
    const constraintError = Object.assign(new Error('Unique constraint violation'), {
      code: 'P2002',
    });
    jest.mocked(prisma.match.create).mockRejectedValue(constraintError);

    const result = await service.likeUser('user-1', 'user-2');

    expect(result).toEqual({ isMatch: true, matchId: 'match-race' });
  });

  it('rejects message reads for archived matches with a forbidden error', async () => {
    jest.mocked(prisma.match.findUnique).mockResolvedValue({
      id: 'match-1',
      userAId: 'user-1',
      userBId: 'user-2',
      isBlocked: false,
      isArchived: true,
    } as any);

    await expect(service.getMessages('match-1', 'user-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(jest.mocked(prisma.message.findMany)).not.toHaveBeenCalled();
  });

  it('rejects message sends for archived matches with a forbidden error', async () => {
    jest.mocked(prisma.match.findUnique).mockResolvedValue({
      id: 'match-1',
      userAId: 'user-1',
      userBId: 'user-2',
      isBlocked: false,
      isArchived: true,
    } as any);

    await expect(
      service.sendMessage('match-1', 'user-1', 'hey'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(jest.mocked(prisma.message.create)).not.toHaveBeenCalled();
  });
});
