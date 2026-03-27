import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BlockService } from '../moderation/block.service';
import {
  buildEventInviteNotification,
  buildEventReminderNotification,
  buildEventRsvpNotification,
} from '../notifications/notification.templates';
import type { CreateEventDto } from './create-event.dto';
import { normalizeCreateEventInput } from './events.create';
import {
  assertCanInviteToEvent,
  assertInvitableMatch,
  resolveInviteeId,
} from './events.invite';
import {
  buildEventDetailInclude,
  buildEventSummaryInclude,
  type EventDetailSource,
  type EventWithRsvps,
  mapEventDetail,
  mapEventInvite,
  mapEventSummary,
} from './events.summary';

interface ActiveUser {
  id: string;
  firstName: string;
}

const EVENT_INVITE_PENDING_STATUS = 'pending' as const;

function isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

function asLogMessage(event: string, context: Record<string, unknown>) {
  return JSON.stringify({ event, ...context });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function buildInviteEventInclude() {
  return {
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
  };
}

function buildEventInviteMessageBody(eventId: string, message?: string) {
  const inviteMarker = `[EVENT_INVITE:${eventId}]`;
  const trimmedMessage = message?.trim();
  return trimmedMessage ? `${trimmedMessage}\n${inviteMarker}` : inviteMarker;
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
      include: buildEventSummaryInclude(userId),
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
      include: buildEventDetailInclude(userId),
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (userId && (await this.blockService.isBlocked(userId, event.host.id))) {
      throw new ForbiddenException('This event is no longer available');
    }

    return mapEventDetail(event as typeof event & EventDetailSource, userId);
  }

  async create(payload: CreateEventDto, userId: string) {
    const normalized = normalizeCreateEventInput(payload);

    const event = await this.prisma.event.create({
      data: {
        title: normalized.title,
        description: normalized.description,
        location: normalized.location,
        category: normalized.category,
        startsAt: normalized.startsAt,
        endsAt: normalized.endsAt,
        hostId: userId,
        rsvps: {
          create: {
            userId,
          },
        },
      },
      include: {
        ...buildEventSummaryInclude(userId),
      },
    });

    return mapEventSummary(event);
  }

  async rsvp(eventId: string, userId: string) {
    const currentUser = await this.getActiveUser(userId);
    const event = await this.detail(eventId, userId, currentUser);

    let created = false;
    try {
      await this.prisma.eventRsvp.create({
        data: {
          eventId,
          userId,
        },
      });
      created = true;
    } catch (error: unknown) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
    }

    // Only send notifications when this request created the RSVP row.
    if (created) {
      await this.prisma.eventInvite.updateMany({
        where: {
          eventId,
          inviteeId: userId,
          status: { not: 'accepted' },
        },
        data: { status: 'accepted' },
      });

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
                operation: 'event_rsvp',
                eventId,
                recipientUserId: userId,
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
              operation: 'event_reminder',
              eventId,
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
    const currentUser = await this.getActiveUser(userId);
    const event = await this.detail(eventId, userId, currentUser);
    assertCanInviteToEvent(event, userId);

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

    const inviteeId = resolveInviteeId(match, userId);

    if (inviteeId === event.host.id) {
      throw new BadRequestException('The event host cannot be invited');
    }

    const invitee = match.userAId === userId ? match.userB : match.userA;
    if (invitee.isDeleted || invitee.isBanned) {
      throw new ForbiddenException('This conversation is no longer available');
    }

    // Check block relationship even when match is not flagged (e.g. block from discovery)
    const blocked = await this.blockService.isBlocked(userId, inviteeId);
    if (blocked) {
      throw new ForbiddenException('This conversation is no longer available');
    }

    const inviteeAlreadyJoined = await this.prisma.eventRsvp.count({
      where: { eventId, userId: inviteeId },
    });
    if (inviteeAlreadyJoined > 0) {
      throw new BadRequestException('This user has already joined the event');
    }

    const inviteWhere = {
      eventId_inviteeId: { eventId, inviteeId },
    } as const;
    const inviteData = {
      eventId,
      inviterId: userId,
      inviteeId,
      matchId,
      status: EVENT_INVITE_PENDING_STATUS,
    };
    const inviteInclude = buildInviteEventInclude();

    const existingInvite = await this.prisma.eventInvite.findUnique({
      where: inviteWhere,
      select: { inviterId: true, matchId: true, status: true },
    });

    const shouldFanOut =
      !existingInvite ||
      existingInvite.status !== EVENT_INVITE_PENDING_STATUS ||
      existingInvite.inviterId !== userId ||
      existingInvite.matchId !== matchId;

    const invite = await this.prisma.$transaction(async (tx) => {
      let nextInvite;

      if (existingInvite) {
        nextInvite = await tx.eventInvite.update({
          where: inviteWhere,
          data: inviteData,
          include: inviteInclude,
        });
      } else {
        try {
          nextInvite = await tx.eventInvite.create({
            data: inviteData,
            include: inviteInclude,
          });
        } catch (error: unknown) {
          if (!isUniqueConstraintError(error)) {
            throw error;
          }

          nextInvite = await tx.eventInvite.update({
            where: inviteWhere,
            data: inviteData,
            include: inviteInclude,
          });
        }
      }

      if (shouldFanOut) {
        await tx.message.create({
          data: {
            matchId,
            senderId: userId,
            body: buildEventInviteMessageBody(eventId, message),
            type: 'EVENT_INVITE',
          },
        });

        await tx.match.update({
          where: { id: matchId },
          data: { updatedAt: new Date() },
        });
      }

      return nextInvite;
    });

    if (shouldFanOut) {
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
    }

    this.logger.debug(
      asLogMessage('events.invite.completed', {
        eventId,
        matchId,
        inviterId: userId,
        inviteeId,
        status: invite.status,
      }),
    );

    return mapEventInvite(invite);
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
          include: buildEventSummaryInclude(userId),
        },
      },
    });

    return rows.map(({ event }) =>
      mapEventSummary({ ...event, rsvps: [{ id: userId }] }),
    );
  }
}
