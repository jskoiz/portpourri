import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventCategory } from '@prisma/client';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BlockService } from '../moderation/block.service';

const eventFindMany = jest.fn();
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
const userFindUnique = jest.fn();
const notificationsCreate = jest.fn().mockResolvedValue(undefined);

const prisma = {
  event: {
    findMany: eventFindMany,
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
    findUnique: userFindUnique,
  },
} as unknown as PrismaService;

const notifications = {
  create: notificationsCreate,
} as unknown as NotificationsService;

const blockServiceMock = {
  getBlockedUserIds: jest.fn().mockResolvedValue([]),
  isBlocked: jest.fn().mockResolvedValue(false),
} as unknown as BlockService;

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

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventsService(prisma, notifications, blockServiceMock);
  });

  describe('list', () => {
    it('returns mapped event summaries without userId', async () => {
      eventFindMany.mockResolvedValue([baseEvent]);

      const result = await service.list();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'event-1',
        title: 'Morning Run',
        attendeesCount: 5,
        joined: false,
      });
    });

    it('sets joined=true when user has an RSVP', async () => {
      eventFindMany.mockResolvedValue([
        { ...baseEvent, rsvps: [{ id: 'rsvp-1' }] },
      ]);

      const result = await service.list('user-1');

      expect(result[0].joined).toBe(true);
    });
  });

  describe('detail', () => {
    it('returns a single mapped event', async () => {
      eventFindUnique.mockResolvedValue(baseEvent);

      const result = await service.detail('event-1');

      expect(result.id).toBe('event-1');
      expect(result.attendeesCount).toBe(5);
    });

    it('throws NotFoundException when event not found', async () => {
      eventFindUnique.mockResolvedValue(null);

      await expect(service.detail('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
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
      eventFindUnique.mockResolvedValue(baseEvent);
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
      eventFindUnique.mockResolvedValue(baseEvent);
      eventRsvpCount.mockResolvedValueOnce(0).mockResolvedValueOnce(6);
      eventRsvpUpsert.mockResolvedValue({});

      const result = await service.rsvp('event-1', 'user-2');

      expect(result).toEqual({ status: 'joined', attendeesCount: 6 });
    });

    it('sends notification to host when a non-host RSVPs', async () => {
      eventFindUnique.mockResolvedValue(baseEvent);
      eventRsvpCount.mockResolvedValueOnce(0).mockResolvedValueOnce(6);
      eventRsvpUpsert.mockResolvedValue({});

      await service.rsvp('event-1', 'user-2');

      expect(notificationsCreate).toHaveBeenCalledWith(
        'host-1',
        expect.objectContaining({ type: 'event_rsvp' }),
      );
    });

    it('does not send host notification when the host RSVPs their own event', async () => {
      eventFindUnique.mockResolvedValue(baseEvent);
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
      eventFindUnique.mockResolvedValue(baseEvent);
      eventRsvpCount.mockResolvedValueOnce(0).mockResolvedValueOnce(6);
      eventRsvpUpsert.mockResolvedValue({});

      await service.rsvp('event-1', 'user-2');

      expect(notificationsCreate).toHaveBeenCalledWith(
        'user-2',
        expect.objectContaining({ type: 'event_reminder' }),
      );
    });

    it('throws NotFoundException when event not found', async () => {
      eventFindUnique.mockResolvedValue(null);

      await expect(
        service.rsvp('missing-event', 'user-2'),
      ).rejects.toBeInstanceOf(NotFoundException);
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
      eventFindUnique.mockResolvedValue(baseEvent);
      matchFindUnique.mockResolvedValue({
        id: 'match-1',
        userAId: 'host-1',
        userBId: 'user-2',
        isBlocked: false,
      });
      eventInviteUpsert.mockResolvedValue({
        id: 'invite-1',
        status: 'pending',
        event: baseEvent,
      });
      messageCreate.mockResolvedValue({});
      matchUpdate.mockResolvedValue({});
      userFindUnique.mockResolvedValue({ firstName: 'Alice' });
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
    });

    it('rejects invites when the user is not part of the match', async () => {
      matchFindUnique.mockResolvedValueOnce({
        id: 'match-1',
        userAId: 'someone-else',
        userBId: 'user-2',
        isBlocked: false,
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
      });

      await expect(
        service.invite('event-1', 'host-1', 'match-1'),
      ).rejects.toThrow('This conversation is no longer available');
    });
  });

  describe('getInvites', () => {
    it('returns invites for the host ordered by createdAt', async () => {
      eventFindUnique.mockResolvedValueOnce({ hostId: 'host-1' });
      eventInviteFindMany.mockResolvedValueOnce([
        {
          id: 'invite-1',
          status: 'pending',
          createdAt: new Date('2026-06-01T09:00:00Z'),
          inviter: { id: 'host-1', firstName: 'Alice' },
          invitee: { id: 'user-2', firstName: 'Bob' },
        },
      ]);

      const result = await service.getInvites('event-1', 'host-1');

      expect(eventInviteFindMany).toHaveBeenCalledWith({
        where: { eventId: 'event-1' },
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
          inviter: { id: 'host-1', firstName: 'Alice' },
          invitee: { id: 'user-2', firstName: 'Bob' },
        },
      ]);
    });

    it('rejects invite listing for non-host users', async () => {
      eventFindUnique.mockResolvedValueOnce({ hostId: 'host-1' });

      await expect(service.getInvites('event-1', 'user-2')).rejects.toThrow(
        'Only the event host can view invites',
      );
    });
  });
});
