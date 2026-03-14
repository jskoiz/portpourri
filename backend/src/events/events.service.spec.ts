/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const eventFindMany = jest.fn();
const eventFindUnique = jest.fn();
const eventCreate = jest.fn();
const eventRsvpFindUnique = jest.fn();
const eventRsvpUpsert = jest.fn();
const eventRsvpCount = jest.fn();
const eventRsvpFindMany = jest.fn();
const notificationsCreate = jest.fn();

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
} as unknown as PrismaService;

const notifications = {
  create: notificationsCreate,
} as unknown as NotificationsService;

const baseEvent = {
  id: 'event-1',
  title: 'Morning Run',
  description: 'A fun run',
  location: 'Central Park',
  imageUrl: null,
  category: 'fitness',
  startsAt: new Date('2026-06-01T08:00:00Z'),
  endsAt: new Date('2026-06-01T09:00:00Z'),
  host: { id: 'host-1', firstName: 'Alice' },
  _count: { rsvps: 5 },
};

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventsService(prisma, notifications);
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
      eventFindMany.mockResolvedValue([{ ...baseEvent, rsvps: [{ id: 'rsvp-1' }] }]);

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

      await expect(service.detail('missing')).rejects.toBeInstanceOf(NotFoundException);
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
      eventRsvpFindUnique.mockResolvedValue({
        id: 'existing-rsvp',
        eventId: 'event-1',
        userId: 'user-2',
      });
      eventRsvpCount.mockResolvedValue(5);

      await expect(service.rsvp('event-1', 'user-2')).resolves.toEqual({
        status: 'joined',
        attendeesCount: 5,
      });

      expect(eventRsvpUpsert).not.toHaveBeenCalled();
      expect(notificationsCreate).not.toHaveBeenCalled();
    });

    it('returns joined status with attendee count', async () => {
      eventFindUnique.mockResolvedValue(baseEvent);
      eventRsvpFindUnique.mockResolvedValue(null);
      eventRsvpUpsert.mockResolvedValue({});
      eventRsvpCount.mockResolvedValue(6);

      const result = await service.rsvp('event-1', 'user-2');

      expect(result).toEqual({ status: 'joined', attendeesCount: 6 });
    });

    it('sends notification to host when a non-host RSVPs', async () => {
      eventFindUnique.mockResolvedValue(baseEvent);
      eventRsvpFindUnique.mockResolvedValue(null);
      eventRsvpUpsert.mockResolvedValue({});
      eventRsvpCount.mockResolvedValue(6);

      await service.rsvp('event-1', 'user-2');

      expect(notificationsCreate).toHaveBeenCalledWith(
        'host-1',
        expect.objectContaining({ type: 'event_rsvp' }),
      );
    });

    it('does not send host notification when the host RSVPs their own event', async () => {
      eventFindUnique.mockResolvedValue(baseEvent);
      eventRsvpFindUnique.mockResolvedValue(null);
      eventRsvpUpsert.mockResolvedValue({});
      eventRsvpCount.mockResolvedValue(5);

      await service.rsvp('event-1', 'host-1');

      const hostCalls = notificationsCreate.mock.calls.filter(
        ([uid]: [string]) => uid === 'host-1',
      );
      const rsvpNotifs = hostCalls.filter(
        ([, payload]: [string, { type: string }]) => payload.type === 'event_rsvp',
      );
      expect(rsvpNotifs).toHaveLength(0);
    });

    it('always sends reminder notification to the RSVPing user', async () => {
      eventFindUnique.mockResolvedValue(baseEvent);
      eventRsvpFindUnique.mockResolvedValue(null);
      eventRsvpUpsert.mockResolvedValue({});
      eventRsvpCount.mockResolvedValue(6);

      await service.rsvp('event-1', 'user-2');

      expect(notificationsCreate).toHaveBeenCalledWith(
        'user-2',
        expect.objectContaining({ type: 'event_reminder' }),
      );
    });

    it('throws NotFoundException when event not found', async () => {
      eventFindUnique.mockResolvedValue(null);

      await expect(service.rsvp('missing-event', 'user-2')).rejects.toBeInstanceOf(
        NotFoundException,
      );
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
});
