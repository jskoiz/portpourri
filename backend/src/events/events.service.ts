import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(userId?: string) {
    const events = await this.prisma.event.findMany({
      orderBy: { startsAt: 'asc' },
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

    return events.map((event) => ({
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
      joined: userId ? (event as any).rsvps?.length > 0 : false,
    }));
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
      joined: userId ? (event as any).rsvps?.length > 0 : false,
    };
  }

  async rsvp(eventId: string, userId: string) {
    const event = await this.detail(eventId);

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

    const total = await this.prisma.eventRsvp.count({ where: { eventId } });

    if (event.host.id !== userId) {
      this.notifications.create(event.host.id, {
        type: 'event_rsvp',
        title: 'New RSVP',
        body: `Someone joined ${event.title}`,
        data: { eventId, attendeeId: userId },
      });
    }

    this.notifications.create(userId, {
      type: 'event_reminder',
      title: 'Event joined',
      body: `You are in for ${event.title}`,
      data: { eventId },
    });

    return { status: 'joined', attendeesCount: total };
  }

  async myEvents(userId: string) {
    try {
      const rows = await this.prisma.eventRsvp.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          event: {
            include: {
              host: { select: { id: true, firstName: true } },
              _count: { select: { rsvps: true } },
            },
          },
        },
      });

      return rows.map(({ event }) => ({
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
        joined: true,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to fetch my events for userId=${userId}: ${message}`,
      );
      throw error;
    }
  }
}
