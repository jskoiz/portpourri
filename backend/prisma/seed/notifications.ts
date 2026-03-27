import { PrismaClient } from '@prisma/client';
import { stableUuid, buildSeedInstant, SeedLike, SeedMatch, SeedEventInvite } from './config';

type UserMap = Map<string, { id: string; firstName: string }>;

export async function createLikeNotifications(
  prisma: PrismaClient,
  likes: SeedLike[],
  createdUsers: UserMap,
): Promise<number> {
  let count = 0;
  for (const like of likes) {
    const fromUser = createdUsers.get(like.fromSlug);
    const toUser = createdUsers.get(like.toSlug);
    if (!fromUser || !toUser) continue;

    const createdAt = buildSeedInstant(like.dayOffset, like.hour);
    await prisma.notification.create({
      data: {
        id: stableUuid('seed-notification', `${like.slug}-to`),
        userId: toUser.id,
        type: 'like_received',
        title: 'New like',
        body: `${fromUser.firstName} liked your profile.`,
        data: { fromUserId: fromUser.id },
        createdAt,
        updatedAt: createdAt,
      },
    });
    count += 1;
  }
  return count;
}

export async function createMatchNotifications(
  prisma: PrismaClient,
  match: SeedMatch,
  matchId: string,
  users: Array<{ id: string; firstName: string }>,
  matchCreatedAt: Date,
): Promise<number> {
  let count = 0;
  for (const user of users) {
    const counterpart = users.find((c) => c.id !== user.id);
    if (!counterpart) continue;
    await prisma.notification.create({
      data: {
        id: stableUuid('seed-notification', `${match.slug}-${user.id}-match`),
        userId: user.id,
        type: 'match_created',
        title: "It's a match!",
        body: `You matched with ${counterpart.firstName}.`,
        data: { matchId, withUserId: counterpart.id },
        createdAt: matchCreatedAt,
        updatedAt: matchCreatedAt,
      },
    });
    count += 1;
  }
  return count;
}

export async function createMessageNotifications(
  prisma: PrismaClient,
  matchSlug: string,
  messageSlug: string,
  matchId: string,
  sender: { id: string; firstName: string },
  recipient: { id: string; firstName: string },
  body: string,
  createdAt: Date,
  isRead: boolean,
): Promise<number> {
  await prisma.notification.create({
    data: {
      id: stableUuid('seed-notification', `${matchSlug}-${messageSlug}-message`),
      userId: recipient.id,
      type: 'message_received',
      title: 'New message',
      body,
      data: { matchId, senderId: sender.id },
      read: isRead,
      readAt: isRead ? createdAt : null,
      createdAt,
      updatedAt: createdAt,
    },
  });
  return 1;
}

export async function createEventInviteNotification(
  prisma: PrismaClient,
  inviteSlug: string,
  eventId: string,
  matchId: string,
  inviter: { id: string; firstName: string },
  invitee: { id: string; firstName: string },
  createdAt: Date,
): Promise<number> {
  await prisma.notification.create({
    data: {
      id: stableUuid('seed-notification', `${inviteSlug}-notification`),
      userId: invitee.id,
      type: 'event_reminder',
      title: 'Event invite',
      body: `${inviter.firstName} invited you to an event.`,
      data: { eventId, matchId, type: 'event_invite' },
      createdAt,
      updatedAt: createdAt,
    },
  });
  return 1;
}

// Batch create RSVP notifications for events
export async function createEventRsvpNotifications(
  prisma: PrismaClient,
  eventId: string,
  hostId: string,
  hostFirstName: string,
  attendeeIds: string[],
  eventTitle: string,
  createdAt: Date,
): Promise<number> {
  let count = 0;
  // Notify host about RSVPs (sample only ~30% to avoid spam)
  const notifyCount = Math.ceil(attendeeIds.length * 0.3);
  for (let i = 0; i < notifyCount && i < attendeeIds.length; i++) {
    const attendeeId = attendeeIds[i];
    if (attendeeId === hostId) continue;
    await prisma.notification.create({
      data: {
        id: stableUuid('seed-notification', `event-rsvp-${eventId}-${attendeeId}`),
        userId: hostId,
        type: 'event_rsvp',
        title: 'New RSVP',
        body: `Someone joined ${eventTitle}.`,
        data: { eventId, attendeeId },
        createdAt: new Date(createdAt.getTime() + (i + 1) * 3600000),
        updatedAt: new Date(createdAt.getTime() + (i + 1) * 3600000),
      },
    });
    count += 1;
  }
  return count;
}
