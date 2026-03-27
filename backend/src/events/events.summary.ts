import type { EventCategory } from '@prisma/client';

export interface EventWithRsvps {
  rsvps?: { id: string }[];
}

export interface EventSummarySource extends EventWithRsvps {
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
}

export interface EventDetailSource extends EventSummarySource {
  rsvps?: Array<{
    id: string;
    userId?: string;
    user: {
      id: string;
      firstName: string;
      photos: Array<{ storageKey: string }>;
    };
  }>;
}

export interface EventInviteSource {
  id: string;
  status: string;
  event: {
    id: string;
    title: string;
    location: string;
    startsAt: Date;
    endsAt: Date | null;
    category: EventCategory | null;
    host: { id: string; firstName: string };
    _count: { rsvps: number };
  };
}

export function buildEventSummaryInclude(userId?: string) {
  return {
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
  };
}

export function buildEventDetailInclude(userId?: string) {
  return {
    host: { select: { id: true, firstName: true } },
    _count: { select: { rsvps: true } },
    rsvps: {
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            id: true,
            firstName: true,
            photos: {
              where: { isPrimary: true },
              select: { storageKey: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' as const },
    },
  };
}

export function mapEventSummary(event: EventSummarySource) {
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

export function mapEventDetail(event: EventDetailSource, viewerUserId?: string) {
  const attendees = (event.rsvps ?? []).map(({ user }) => ({
    id: user.id,
    firstName: user.firstName,
    photoUrl: user.photos[0]?.storageKey ?? null,
  }));

  return {
    ...mapEventSummary({ ...event, rsvps: [] }),
    joined: viewerUserId
      ? (event.rsvps?.some((rsvp) => rsvp.userId === viewerUserId) ?? false)
      : false,
    attendees,
  };
}

export function mapEventInvite(invite: EventInviteSource) {
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
