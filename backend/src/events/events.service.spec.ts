import { BadRequestException, ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { EventCategory } from '@prisma/client';
import { NotificationType } from '../common/enums';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BlockService } from '../moderation/block.service';

const eventFindMany = jest.fn();
const eventFindFirst = jest.fn();
const eventFindUnique = jest.fn();
const eventCreate = jest.fn();
const eventRsvpFindUnique = jest.fn();
const eventRsvpUpsert = jest.fn();
const eventRsvpCount = jest.fn();
const eventRsvpFindMany = jest.fn();
const eventInviteUpsert = jest.fn();
const eventInviteFindMany = jest.fn();
const matchFindUnique = jest.fn();
const matchUpdate = jest.fn();
const messageCreate = jest.fn();
const userFindFirst = jest.fn();
const notificationsCreate = jest.fn().mockResolvedValue(undefined);

const prisma = {
  event: {
    findMany: eventFindMany,
    findFirst: eventFindFirst,
    findUnique: eventFindUnique,
    create: eventCreate,
  },
  eventRsvp: {
    findUnique: eventRsvpFindUnique,
    upsert: eventRsvpUpsert,
    count: eventRsvpCount,
    findMany: eventRsvpFindMany,
  },
  eventInvite: {
    upsert: eventInviteUpsert,
    findMany: eventInviteFindMany,
  },
  match: {
    findUnique: matchFindUnique,
    update: matchUpdate,
  },
  message: {
    create: messageCreate,
  },
  user: {
    findFirst: userFindFirst,
  },
} as unknown as PrismaService;

const notifications = {
  create: notificationsCreate,
} as unknown as NotificationsService;

const blockServiceMock: jest.Mocked<BlockService> = {
  getBlockedUserIds: jest.fn().mockResolvedValue([]),
  isBlocked: jest.fn().mockResolvedValue(false),
} as unknown as jest.Mocked<BlockService>;

const baseEvent = {
  id: 'event-1',
  title: 'Morning Run',
  description: 'A fun run',
  location: 'Central Park',
  imageUrl: null,
  category: EventCategory.FITNESS,
  startsAt: new Date('2026-06-01T08:00:00Z'),
  endsAt: new Date('2026-06-01T09:00:00Z'),
  host: { id: 'host-1', firstName: 'Alice' },
  _count: { rsvps: 5 },
};

describe('EventsService', () => {
  let service: EventsService;
  let debugSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    userFindFirst.mockResolvedValue({ id: 'host-1', firstName: 'Alice' });
    debugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    service = new EventsService(prisma, notifications, blockServiceMock);
  });

  afterEach(() => {
    debugSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('list', () => {
    it('returns mapped event summaries without userId', async () => {
      eventFindMany.mockResolvedValue([baseEvent]);

      const result = await service.list();

      expect(eventFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startsAt: { gte: expect.any(Date) },
            host: {
              is: {
                isDeleted: false,
                isBanned: false,
              },
            },
          }),
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'event-1',
        title: 'Morning Run',
        attendeesCount: 5,
        joined: false,
      });
    });

    it('excludes blocked hosts from the list query', async () => {
      blockServiceMock.getBlockedUserIds.mockResolvedValue(['blocked-host']);
      eventFindMany.mockResolvedValue([]);

      await service.list('user-1');

      expect(eventFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startsAt: { gte: expect.any(Date) },
            hostId: { notIn: ['blocked-host'] },
          }),
        }),
      );
    });

    it('sets joined=true when user has an RSVP', async () => {
      eventFindMany.mockResolvedValue([
        { ...baseEvent, rsvps: [{ id: 'rsvp-1' }] },
      ]);

      const result = await service.list('user-1');

      expect(result[0].joined).toBe(true);
    });

    it('rejects list access for deleted or banned users', async () => {
      userFindFirst.mockResolvedValueOnce(null);

      await expect(service.list('user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(blockServiceMock.getBlockedUserIds).not.toHaveBeenCalled();
      expect(eventFindMany).not.toHaveBeenCalled();
    });
  });

  describe('detail', () => {
    it('returns a single mapped event', async () => {
      eventFindFirst.mockResolvedValue(baseEvent);

      const result = await service.detail('event-1');

      expect(eventFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'event-1',
            host: {
              is: {
                isDeleted: false,
                isBanned: false,
              },
            },
          },
        }),
      );
      expect(result.id).toBe('event-1');
      expect(result.attendeesCount).toBe(5);
    });

    it('excludes blocked hosts from the detail query when a user is present', async () => {
      blockServiceMock.getBlockedUserIds.mockResolvedValue(['blocked-host']);
      eventFindFirst.mockResolvedValue(baseEvent);

      await service.detail('event-1', 'user-1');

      expect(eventFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'event-1',
            host: {
              is: {
                isDeleted: false,
                isBanned: false,
              },
            },
            hostId: { notIn: ['blocked-host'] },
          }),
        }),
      );
    });

    it('throws NotFoundException when event not found', async () => {
      eventFindFirst.mockResolvedValue(null);

      await expect(service.detail('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects detail access for deleted or banned users', async () => {
      userFindFirst.mockResolvedValueOnce(null);

      await expect(service.detail('event-1', 'user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(blockServiceMock.getBlockedUserIds).not.toHaveBeenCalled();
      expect(eventFindFirst).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const validPayload = {
      title: 'Yoga Class',
      location: 'Studio A',
      startsAt: '2026-07-01T10:00:00Z',
    };

    it('creates and returns a mapped event', async () => {
      eventCreate.mockResolvedValue({
        ...baseEvent,
        title: 'Yoga Class',
        rsvps: [{ id: 'rsvp-1' }],
      });

      const result = await service.create(validPayload, 'host-1');

      expect(result.title).toBe('Yoga Class');
      expect(result.joined).toBe(true);
    });

    it('throws BadRequest when title is missing', async () => {
      await expect(
        service.create({ ...validPayload, title: '   ' }, 'host-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when location is missing', async () => {
      await expect(
        service.create({ ...validPayload, location: '' }, 'host-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest for invalid startsAt date', async () => {
      await expect(
        service.create({ ...validPayload, startsAt: 'not-a-date' }, 'host-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when endsAt is before startsAt', async () => {
      await expect(
        service.create(
          { ...validPayload, endsAt: '2026-06-30T09:00:00Z' },
          'host-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('rsvp', () => {
    it('does not send duplicate notifications when the RSVP already exists', async () => {
      eventFindFirst.mockResolvedValue(baseEvent);
      // First count call: check if RSVP already exists (returns 1 = existing)
      // Second count call: total attendees
      eventRsvpCount.mockResolvedValueOnce(1).mockResolvedValueOnce(5);
      eventRsvpUpsert.mockResolvedValue({});

      await expect(service.rsvp('event-1', 'user-2')).resolves.toEqual({
        status: 'joined',
        attendeesCount: 5,
      });

      expect(eventRsvpUpsert).toHaveBeenCalled();
      expect(notificationsCreate).not.toHaveBeenCalled();
    });

    it('returns joined status with attendee count', async () => {
      eventFindFirst.mockResolvedValue(baseEvent);
      eventRsvpCount.mockResolvedValueOnce(0).mockResolvedValueOnce(6);
      eventRsvpUpsert.mockResolvedValue({});

      const result = await service.rsvp('event-1', 'user-2');

      expect(result).toEqual({ status: 'joined', attendeesCount: 6 });
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('"event":"events.rsvp.completed"'),
      );
    });

    it('sends notification to host when a non-host RSVPs', async () => {
      eventFindFirst.mockResolvedValue(baseEvent);
      eventRsvpCount.mockResolvedValueOnce(0).mockResolvedValueOnce(6);
      eventRsvpUpsert.mockResolvedValue({});

      await service.rsvp('event-1', 'user-2');

      expect(notificationsCreate).toHaveBeenCalledWith(
        'host-1',
        expect.objectContaining({ type: 'event_rsvp' }),
      );
    });

    it('does not send host notification when the host RSVPs their own event', async () => {
      eventFindFirst.mockResolvedValue(baseEvent);
      eventRsvpCount.mockResolvedValueOnce(0).mockResolvedValueOnce(5);
      eventRsvpUpsert.mockResolvedValue({});

      await service.rsvp('event-1', 'host-1');

      const hostCalls = notificationsCreate.mock.calls.filter(
        ([uid]: [string]) => uid === 'host-1',
      );
      const rsvpNotifs = hostCalls.filter(
        ([, payload]: [string, { type: string }]) =>
          payload.type === 'event_rsvp',
      );
      expect(rsvpNotifs).toHaveLength(0);
    });

    it('always sends reminder notification to the RSVPing user', async () => {
      eventFindFirst.mockResolvedValue(baseEvent);
      eventRsvpCount.mockResolvedValueOnce(0).mockResolvedValueOnce(6);
      eventRsvpUpsert.mockResolvedValue({});

      await service.rsvp('event-1', 'user-2');

      expect(notificationsCreate).toHaveBeenCalledWith(
        'user-2',
        expect.objectContaining({ type: 'event_reminder' }),
      );
    });

    it('logs RSVP notification failures with operation context', async () => {
      eventFindUnique.mockResolvedValue(baseEvent);
      eventRsvpCount.mockResolvedValueOnce(0).mockResolvedValueOnce(6);
      eventRsvpUpsert.mockResolvedValue({});
      notificationsCreate.mockRejectedValueOnce(new Error('notify down'));

      await service.rsvp('event-1', 'user-2');
      await new Promise(setImmediate);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"event":"events.notification_failed"'),
        expect.anything(),
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"operation":"event_rsvp_host"'),
        expect.anything(),
      );
    });

    it('throws NotFoundException when event not found', async () => {
      eventFindFirst.mockResolvedValue(null);

      await expect(
        service.rsvp('missing-event', 'user-2'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects RSVP attempts from deleted or banned users', async () => {
      userFindFirst.mockResolvedValueOnce(null);

      await expect(service.rsvp('event-1', 'user-2')).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(eventFindFirst).not.toHaveBeenCalled();
      expect(eventRsvpUpsert).not.toHaveBeenCalled();
    });
  });

  describe('create validation', () => {
    it('currently allows startsAt values in the past', async () => {
      await expect(
        service.create(
          {
            title: 'Past Event',
            location: 'Central Park',
            startsAt: '2020-01-01T10:00:00Z',
          },
          'host-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepts an event without endsAt', async () => {
      eventCreate.mockResolvedValue({
        ...baseEvent,
        endsAt: null,
        rsvps: [{ id: 'rsvp-1' }],
      });

      const result = await service.create(
        {
          title: 'Open-ended Run',
          location: 'Beach',
          startsAt: '2026-08-01T06:00:00Z',
        },
        'host-1',
      );

      expect(result).toBeDefined();
      expect(result.title).toBe('Morning Run');
    });

    it('throws BadRequest when endsAt is invalid', async () => {
      await expect(
        service.create(
          {
            title: 'Bad End',
            location: 'Studio A',
            startsAt: '2026-07-01T10:00:00Z',
            endsAt: 'not-a-date',
          },
          'host-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('myEvents', () => {
    it('returns events the user has joined', async () => {
      eventRsvpFindMany.mockResolvedValue([
        {
          event: baseEvent,
        },
      ]);

      const result = await service.myEvents('user-2');

      expect(result).toHaveLength(1);
      expect(result[0].joined).toBe(true);
    });

    it('returns empty array when user has no RSVPs', async () => {
      eventRsvpFindMany.mockResolvedValue([]);

      const result = await service.myEvents('user-nobody');

      expect(result).toEqual([]);
    });
  });

  describe('invite', () => {
    beforeEach(() => {
      eventFindFirst.mockResolvedValue(baseEvent);
      matchFindUnique.mockResolvedValue({
        id: 'match-1',
        userAId: 'host-1',
        userBId: 'user-2',
        isBlocked: false,
        isArchived: false,
        userA: {
          id: 'host-1',
          isDeleted: false,
          isBanned: false,
        },
        userB: {
          id: 'user-2',
          isDeleted: false,
          isBanned: false,
        },
      });
      eventInviteUpsert.mockResolvedValue({
        id: 'invite-1',
        status: 'pending',
        event: baseEvent,
      });
      messageCreate.mockResolvedValue({});
      matchUpdate.mockResolvedValue({});
    });

    it('creates an invite and returns the mapped event payload', async () => {
      const result = await service.invite('event-1', 'host-1', 'match-1', 'Join us');

      expect(eventInviteUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId_inviteeId: { eventId: 'event-1', inviteeId: 'user-2' } },
        }),
      );
      expect(messageCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            matchId: 'match-1',
            senderId: 'host-1',
            type: 'EVENT_INVITE',
          }),
        }),
      );
      expect(notificationsCreate).toHaveBeenCalledWith(
        'user-2',
        expect.objectContaining({
          type: NotificationType.EventInvite,
          sourceUserId: 'host-1',
          data: expect.objectContaining({
            eventId: 'event-1',
            matchId: 'match-1',
            inviterId: 'host-1',
            withUserId: 'host-1',
          }),
        }),
      );
      expect(result).toEqual({
        id: 'invite-1',
        status: 'pending',
        event: {
          id: 'event-1',
          title: 'Morning Run',
          location: 'Central Park',
          startsAt: baseEvent.startsAt,
          endsAt: baseEvent.endsAt,
          category: baseEvent.category,
          host: baseEvent.host,
          attendeesCount: 5,
        },
      });
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('"event":"events.invite.completed"'),
      );
    });

    it('rejects invites when the requester is not the host or RSVP attendee', async () => {
      await expect(
        service.invite('event-1', 'user-3', 'match-1'),
      ).rejects.toThrow("You must be the host or have RSVP'd to invite others");

      expect(matchFindUnique).not.toHaveBeenCalled();
      expect(eventInviteUpsert).not.toHaveBeenCalled();
      expect(messageCreate).not.toHaveBeenCalled();
    });

    it('rejects invites when the requester is deleted or banned', async () => {
      userFindFirst.mockResolvedValueOnce(null);

      await expect(
        service.invite('event-1', 'user-3', 'match-1'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(eventFindFirst).not.toHaveBeenCalled();
      expect(matchFindUnique).not.toHaveBeenCalled();
      expect(eventInviteUpsert).not.toHaveBeenCalled();
      expect(messageCreate).not.toHaveBeenCalled();
    });

    it('rejects invites when the user is not part of the match', async () => {
      matchFindUnique.mockResolvedValueOnce({
        id: 'match-1',
        userAId: 'someone-else',
        userBId: 'user-2',
        isBlocked: false,
        isArchived: false,
        userA: {
          id: 'someone-else',
          isDeleted: false,
          isBanned: false,
        },
        userB: {
          id: 'user-2',
          isDeleted: false,
          isBanned: false,
        },
      });

      await expect(
        service.invite('event-1', 'host-1', 'match-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects invites when the conversation is blocked', async () => {
      matchFindUnique.mockResolvedValueOnce({
        id: 'match-1',
        userAId: 'host-1',
        userBId: 'user-2',
        isBlocked: true,
        isArchived: false,
        userA: {
          id: 'host-1',
          isDeleted: false,
          isBanned: false,
        },
        userB: {
          id: 'user-2',
          isDeleted: false,
          isBanned: false,
        },
      });

      await expect(
        service.invite('event-1', 'host-1', 'match-1'),
      ).rejects.toThrow('This conversation is no longer available');
    });

    it('rejects invites when the conversation is archived', async () => {
      matchFindUnique.mockResolvedValueOnce({
        id: 'match-1',
        userAId: 'host-1',
        userBId: 'user-2',
        isBlocked: false,
        isArchived: true,
        userA: {
          id: 'host-1',
          isDeleted: false,
          isBanned: false,
        },
        userB: {
          id: 'user-2',
          isDeleted: false,
          isBanned: false,
        },
      });

      await expect(
        service.invite('event-1', 'host-1', 'match-1'),
      ).rejects.toThrow('This conversation is no longer available');

      expect(blockServiceMock.isBlocked).not.toHaveBeenCalled();
      expect(eventInviteUpsert).not.toHaveBeenCalled();
      expect(messageCreate).not.toHaveBeenCalled();
    });

    it('rejects invites when the invitee is deleted or banned', async () => {
      matchFindUnique.mockResolvedValueOnce({
        id: 'match-1',
        userAId: 'host-1',
        userBId: 'user-2',
        isBlocked: false,
        isArchived: false,
        userA: {
          id: 'host-1',
          isDeleted: false,
          isBanned: false,
        },
        userB: {
          id: 'user-2',
          isDeleted: true,
          isBanned: false,
        },
      });

      await expect(
        service.invite('event-1', 'host-1', 'match-1'),
      ).rejects.toThrow('This conversation is no longer available');

      expect(blockServiceMock.isBlocked).not.toHaveBeenCalled();
      expect(eventInviteUpsert).not.toHaveBeenCalled();
      expect(messageCreate).not.toHaveBeenCalled();
    });

    it('rejects invites when the invitee is blocked even if the match is valid', async () => {
      blockServiceMock.isBlocked.mockResolvedValueOnce(true);

      await expect(
        service.invite('event-1', 'host-1', 'match-1'),
      ).rejects.toThrow('This conversation is no longer available');

      expect(eventInviteUpsert).not.toHaveBeenCalled();
      expect(messageCreate).not.toHaveBeenCalled();
      expect(matchUpdate).not.toHaveBeenCalled();
    });
  });

  describe('getInvites', () => {
    it('returns invites for the host ordered by createdAt', async () => {
      eventFindFirst.mockResolvedValueOnce({ hostId: 'host-1' });
      eventInviteFindMany.mockResolvedValueOnce([
        {
          id: 'invite-1',
          status: 'pending',
          createdAt: new Date('2026-06-01T09:00:00Z'),
          inviter: {
            id: 'host-1',
            firstName: 'Alice',
            isDeleted: false,
            isBanned: false,
          },
          invitee: {
            id: 'user-2',
            firstName: 'Bob',
            isDeleted: false,
            isBanned: false,
          },
        },
      ]);

      const result = await service.getInvites('event-1', 'host-1');

      expect(eventFindFirst).toHaveBeenCalledWith({
        where: {
          id: 'event-1',
          host: {
            is: {
              isDeleted: false,
              isBanned: false,
            },
          },
        },
        select: { hostId: true },
      });
      expect(eventInviteFindMany).toHaveBeenCalledWith({
        where: {
          eventId: 'event-1',
          inviter: {
            isDeleted: false,
            isBanned: false,
          },
          invitee: {
            isDeleted: false,
            isBanned: false,
          },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          inviter: { select: { id: true, firstName: true } },
          invitee: { select: { id: true, firstName: true } },
        },
      });
      expect(result).toEqual([
        {
          id: 'invite-1',
          status: 'pending',
          createdAt: new Date('2026-06-01T09:00:00Z'),
          inviter: {
            id: 'host-1',
            firstName: 'Alice',
            isDeleted: false,
            isBanned: false,
          },
          invitee: {
            id: 'user-2',
            firstName: 'Bob',
            isDeleted: false,
            isBanned: false,
          },
        },
      ]);
    });

    it('rejects invite listing for non-host users', async () => {
      eventFindFirst.mockResolvedValueOnce({ hostId: 'host-1' });

      await expect(service.getInvites('event-1', 'user-2')).rejects.toThrow(
        'Only the event host can view invites',
      );
    });
  });
});
