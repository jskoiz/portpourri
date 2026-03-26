import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BlockService } from '../moderation/block.service';
import {
  buildEventInviteNotification,
  buildEventReminderNotification,
  buildEventRsvpNotification,
} from '../notifications/notification.templates';
import type { EventCategory } from '@prisma/client';
import type { CreateEventDto } from './create-event.dto';

interface EventWithRsvps {
  rsvps?: { id: string }[];
}

interface ActiveUser {
  id: string;
  firstName: string;
}

function asLogMessage(event: string, context: Record<string, unknown>) {
  return JSON.stringify({ event, ...context });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
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
    private readonly blockService: BlockService,
  ) {}

  private async getActiveUser(userId: string): Promise<ActiveUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isDeleted: false, isBanned: false },
      select: { id: true, firstName: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private buildVisibleEventWhere(blockedIds: string[] = []) {
    return {
      host: {
        is: {
          isDeleted: false,
          isBanned: false,
        },
      },
      ...(blockedIds.length
        ? {
            hostId: {
              notIn: blockedIds,
            },
          }
        : {}),
    };
  }

  async list(userId?: string, take = 20, skip = 0) {
    if (userId) {
      await this.getActiveUser(userId);
    }

    const blockedIds = userId
      ? await this.blockService.getBlockedUserIds(userId)
      : [];

    const events = await this.prisma.event.findMany({
      where: {
        startsAt: { gte: new Date() },
        ...this.buildVisibleEventWhere(blockedIds),
      },
      orderBy: { startsAt: 'asc' },
      take,
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

  async detail(id: string, userId?: string, activeUser?: ActiveUser) {
    if (userId && !activeUser) {
      await this.getActiveUser(userId);
    }

    const blockedIds = userId
      ? await this.blockService.getBlockedUserIds(userId)
      : [];

    const event = await this.prisma.event.findFirst({
      where: {
        id,
        ...this.buildVisibleEventWhere(blockedIds),
      },
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

    if (userId && (await this.blockService.isBlocked(userId, event.host.id))) {
      throw new ForbiddenException('This event is no longer available');
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

    if (startsAt <= new Date()) {
      throw new BadRequestException('Start time must be in the future');
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

    this.logger.debug(
      asLogMessage('events.create.completed', {
        userId,
        eventId: event.id,
        category: event.category,
        hasEndsAt: Boolean(event.endsAt),
      }),
    );

    return mapEventSummary(event);
  }

  async rsvp(eventId: string, userId: string) {
const currentUser = await this.getActiveUser(userId);
    const event = await this.detail(eventId, userId, currentUser);

    const countBefore = await this.prisma.eventRsvp.count({
      where: { eventId, userId },
    });

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

    // Only send notifications for newly created RSVPs
    if (countBefore === 0) {
      this.logger.debug(
        asLogMessage('events.rsvp.completed', {
          eventId,
          userId,
          outcome: 'joined',
          isNewRsvp: true,
          hostId: event.host.id,
        }),
      );
      if (event.host.id !== userId) {
        void this.notifications
          .create(
            event.host.id,
            buildEventRsvpNotification(eventId, userId, event.title),
          )
          .catch((err) =>
            this.logger.error(
              asLogMessage('events.notification_failed', {
                operation: 'event_rsvp_host',
                eventId,
                userId,
                recipientUserId: event.host.id,
                error: errorMessage(err),
              }),
              err instanceof Error ? err.stack : undefined,
            ),
          );
      }

      void this.notifications
        .create(
          userId,
          buildEventReminderNotification(eventId, event.title),
        )
        .catch((err) =>
          this.logger.error(
            asLogMessage('events.notification_failed', {
              operation: 'event_reminder_attendee',
              eventId,
              userId,
              recipientUserId: userId,
              error: errorMessage(err),
            }),
            err instanceof Error ? err.stack : undefined,
          ),
        );
    } else {
      this.logger.debug(
        asLogMessage('events.rsvp.completed', {
          eventId,
          userId,
          outcome: 'already_joined',
          isNewRsvp: false,
          hostId: event.host.id,
        }),
      );
    }

    const total = await this.prisma.eventRsvp.count({ where: { eventId } });

    return { status: 'joined', attendeesCount: total };
  }

  async invite(
    eventId: string,
    userId: string,
    matchId: string,
    message?: string,
  ) {
    // Validate event exists
    const currentUser = await this.getActiveUser(userId);
    const event = await this.detail(eventId, userId, currentUser);

    // Validate user is host or has RSVP'd
    const isHost = event.host.id === userId;
    if (!isHost && !event.joined) {
      throw new ForbiddenException(
        "You must be the host or have RSVP'd to invite others",
      );
    }

    // Validate match exists and user is a participant
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        userAId: true,
        userBId: true,
        isBlocked: true,
        isArchived: true,
        userA: {
          select: {
            id: true,
            isDeleted: true,
            isBanned: true,
          },
        },
        userB: {
          select: {
            id: true,
            isDeleted: true,
            isBanned: true,
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.userAId !== userId && match.userBId !== userId) {
      throw new ForbiddenException('You are not part of this match');
    }

    if (match.isBlocked || match.isArchived) {
      throw new ForbiddenException('This conversation is no longer available');
    }

    const inviteeId =
      match.userAId === userId ? match.userBId : match.userAId;

    const invitee = match.userAId === userId ? match.userB : match.userA;
    if (invitee.isDeleted || invitee.isBanned) {
      throw new ForbiddenException('This conversation is no longer available');
    }

    // Check block relationship even when match is not flagged (e.g. block from discovery)
    const blocked = await this.blockService.isBlocked(userId, inviteeId);
    if (blocked) {
      throw new ForbiddenException('This conversation is no longer available');
    }

    // Create the invite record (upsert to handle duplicate gracefully)
    const invite = await this.prisma.eventInvite.upsert({
      where: {
        eventId_inviteeId: { eventId, inviteeId },
      },
      create: {
        eventId,
        inviterId: userId,
        inviteeId,
        matchId,
      },
      update: {
        status: 'pending',
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            location: true,
            startsAt: true,
            endsAt: true,
            category: true,
            host: { select: { id: true, firstName: true } },
            _count: { select: { rsvps: true } },
          },
        },
      },
    });

    // Send an event_invite message in the match conversation
    const inviteBody = `[EVENT_INVITE:${eventId}]`;
    await this.prisma.message.create({
      data: {
        matchId,
        senderId: userId,
        body: message ? `${message}\n${inviteBody}` : inviteBody,
        type: 'EVENT_INVITE',
      },
    });

    // Update match timestamp
    await this.prisma.match.update({
      where: { id: matchId },
      data: { updatedAt: new Date() },
    });

    // Send notification to invitee
    void this.notifications
      .create(
        inviteeId,
        buildEventInviteNotification(
          eventId,
          userId,
          currentUser.firstName,
          event.title,
          matchId,
        ),
      )
      .catch((err) =>
        this.logger.error(
          asLogMessage('events.notification_failed', {
            operation: 'event_invite',
            eventId,
            matchId,
            inviterId: userId,
            inviteeId,
            error: errorMessage(err),
          }),
          err instanceof Error ? err.stack : undefined,
        ),
      );

    this.logger.debug(
      asLogMessage('events.invite.completed', {
        eventId,
        matchId,
        inviterId: userId,
        inviteeId,
        status: invite.status,
      }),
    );

    return {
      id: invite.id,
      status: invite.status,
      event: {
        id: invite.event.id,
        title: invite.event.title,
        location: invite.event.location,
        startsAt: invite.event.startsAt,
        endsAt: invite.event.endsAt,
        category: invite.event.category,
        host: invite.event.host,
        attendeesCount: invite.event._count.rsvps,
      },
    };
  }

  async getInvites(eventId: string, userId: string) {
    await this.getActiveUser(userId);

    // Only the host can view invites for an event
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        ...this.buildVisibleEventWhere(),
      },
      select: { hostId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.hostId !== userId) {
      throw new ForbiddenException('Only the event host can view invites');
    }

    const invites = await this.prisma.eventInvite.findMany({
      where: {
        eventId,
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

    return invites.map((inv) => ({
      id: inv.id,
      status: inv.status,
      createdAt: inv.createdAt,
      inviter: inv.inviter,
      invitee: inv.invitee,
    }));
  }

  async myEvents(userId: string, take = 20, skip = 0) {
    await this.getActiveUser(userId);
    const blockedIds = await this.blockService.getBlockedUserIds(userId);

    const rows = await this.prisma.eventRsvp.findMany({
      where: {
        userId,
        event: this.buildVisibleEventWhere(blockedIds),
      },
      orderBy: { createdAt: 'desc' },
      take,
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
