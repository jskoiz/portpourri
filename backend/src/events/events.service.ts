import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  buildEventReminderNotification,
  buildEventRsvpNotification,
} from '../notifications/notification.templates';
import type { EventCategory } from '@prisma/client';
import type { CreateEventDto } from './create-event.dto';

interface EventWithRsvps {
  rsvps?: { id: string }[];
}

function mapEventSummary(
  event: {
    id: string;
    title: string;
    description: string | null;
    location: string;
    imageUrl: string | null;
    category: EventCategory | null;
    startsAt: Date;
    endsAt: Date | null;
    host: { id: string; firstName: string };
    _count: { rsvps: number };
  } & EventWithRsvps,
) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    imageUrl: event.imageUrl,
    category: event.category,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    host: event.host,
    attendeesCount: event._count.rsvps,
    joined: (event.rsvps?.length ?? 0) > 0,
  };
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(userId?: string, take = 20, skip = 0) {
    const safeTake = Math.min(Math.max(take, 1), 100);
    const events = await this.prisma.event.findMany({
      orderBy: { startsAt: 'asc' },
      take: safeTake,
      skip,
      include: {
        host: { select: { id: true, firstName: true } },
        _count: { select: { rsvps: true } },
        ...(userId
          ? {
              rsvps: {
                where: { userId },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    return events.map((event) =>
      mapEventSummary(event as typeof event & EventWithRsvps),
    );
  }

  async detail(id: string, userId?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, firstName: true } },
        _count: { select: { rsvps: true } },
        ...(userId
          ? {
              rsvps: {
                where: { userId },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return mapEventSummary(event as typeof event & EventWithRsvps);
  }

  async create(payload: CreateEventDto, userId: string) {
    const title = payload.title?.trim();
    const location = payload.location?.trim();
    const description = payload.description?.trim();
    const category = payload.category ?? null;
    const startsAt = new Date(payload.startsAt);
    const endsAt = payload.endsAt ? new Date(payload.endsAt) : null;

    if (!title) {
      throw new BadRequestException('Title is required');
    }

    if (!location) {
      throw new BadRequestException('Location is required');
    }

    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('A valid start time is required');
    }

    if (endsAt && Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException('End time must be a valid date');
    }

    if (endsAt && endsAt <= startsAt) {
      throw new BadRequestException('End time must be after the start time');
    }

    const event = await this.prisma.event.create({
      data: {
        title,
        description: description || null,
        location,
        category: category || null,
        startsAt,
        endsAt,
        hostId: userId,
        rsvps: {
          create: {
            userId,
          },
        },
      },
      include: {
        host: { select: { id: true, firstName: true } },
        _count: { select: { rsvps: true } },
        rsvps: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    return mapEventSummary(event);
  }

  async rsvp(eventId: string, userId: string) {
    const event = await this.detail(eventId);
    const existingRsvp = await this.prisma.eventRsvp.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (!existingRsvp) {
      await this.prisma.eventRsvp.upsert({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        create: {
          eventId,
          userId,
        },
        update: {},
      });

      if (event.host.id !== userId) {
        void this.notifications.create(
          event.host.id,
          buildEventRsvpNotification(eventId, userId, event.title),
        );
      }

      void this.notifications.create(
        userId,
        buildEventReminderNotification(eventId, event.title),
      );
    }

    const total = await this.prisma.eventRsvp.count({ where: { eventId } });

    return { status: 'joined', attendeesCount: total };
  }

  async myEvents(userId: string, take = 20, skip = 0) {
    const rows = await this.prisma.eventRsvp.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(take, 100),
      skip,
      include: {
        event: {
          include: {
            host: { select: { id: true, firstName: true } },
            _count: { select: { rsvps: true } },
          },
        },
      },
    });

    return rows.map(({ event }) =>
      mapEventSummary({ ...event, rsvps: [{ id: userId }] }),
    );
  }
}
