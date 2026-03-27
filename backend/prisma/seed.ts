import { PrismaClient, AuthProvider, MessageType } from '@prisma/client';
import {
  DEMO_EMAIL_DOMAIN,
  LEGACY_SEED_EMAILS,
  activityCatalog,
  stableUuid,
  demoEmail,
  buildSeedInstant,
  SEED_ANCHOR,
} from './seed/config';
import { seedUsers } from './seed/users';
import { seedEvents } from './seed/events';
import { outerIslandEvents } from './seed/events-outer-islands';
import { extraOahuEvents } from './seed/events-extra';
import { getPhotosForUser } from './seed/user-photos';
import { allMatches, allLikes, allPasses, allEventInvites } from './seed/social-graph';
import {
  createLikeNotifications,
  createMatchNotifications,
  createMessageNotifications,
  createEventInviteNotification,
  createEventRsvpNotifications,
} from './seed/notifications';

const prisma = new PrismaClient();

// ── Activity catalog upsert ───────────────────────────────────────

async function seedActivities() {
  const created = await Promise.all(
    activityCatalog.map((activity) =>
      prisma.fitnessActivity.upsert({
        where: { slug: activity.slug },
        update: { name: activity.name },
        create: activity,
      }),
    ),
  );
  return new Map(created.map((a) => [a.slug, a.id]));
}

// ── Cleanup previous seed data ────────────────────────────────────

async function cleanupPreviousDemoUsers() {
  const deleted = await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } },
        { email: { in: LEGACY_SEED_EMAILS } },
      ],
    },
  });
  return deleted.count;
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log('Refreshing BRDG demo seed (expanded)...');

  // 1. Seed activities
  const activityIdsBySlug = await seedActivities();

  // 2. Cleanup previous demo users
  const deletedUsers = await cleanupPreviousDemoUsers();
  console.log(`Removed ${deletedUsers} previous demo users.`);

  // 3. Create users in batches of 20
  const createdUsers = new Map<string, { id: string; firstName: string }>();
  const BATCH_SIZE = 20;

  for (let i = 0; i < seedUsers.length; i += BATCH_SIZE) {
    const batch = seedUsers.slice(i, i + BATCH_SIZE);
    await prisma.$transaction(async (tx) => {
      for (const user of batch) {
        const created = await tx.user.create({
          data: {
            id: stableUuid('seed-user', user.slug),
            email: demoEmail(user.slug),
            firstName: user.firstName,
            birthdate: new Date(user.birthdate),
            gender: user.gender,
            authProvider: AuthProvider.EMAIL,
            hasVerifiedEmail: true,
            isOnboarded: true,
            profile: {
              create: {
                city: user.city,
                country: user.country,
                latitude: user.latitude,
                longitude: user.longitude,
                bio: user.bio,
                intentWorkout: user.intentWorkout,
                intentDating: user.intentDating,
                intentFriends: user.intentFriends,
                showMeMen: user.showMeMen ?? true,
                showMeWomen: user.showMeWomen ?? true,
                showMeOther: user.showMeOther ?? true,
                maxDistanceKm: user.maxDistanceKm ?? 50,
                discoveryPaused: user.discoveryPaused ?? false,
              },
            },
            fitnessProfile: {
              create: {
                intensityLevel: user.fitness.intensityLevel,
                weeklyFrequencyBand: user.fitness.weeklyFrequencyBand,
                primaryGoal: user.fitness.primaryGoal,
                secondaryGoal: user.fitness.secondaryGoal ?? null,
                favoriteActivities: user.fitness.favoriteActivities,
                trainingStyle: user.fitness.trainingStyle,
                prefersMorning: user.fitness.prefersMorning ?? null,
                prefersEvening: user.fitness.prefersEvening ?? null,
              },
            },
            photos: {
              create: getPhotosForUser(user.slug, user.photoCount ?? 4, user.activities).map(
                (url, photoIndex) => ({
                  storageKey: url,
                  isPrimary: photoIndex === 0,
                  sortOrder: photoIndex,
                }),
              ),
            },
            notificationPreferences: {
              create: {
                messages: user.slug !== 'rowan',
                likes: user.slug !== 'nia',
                matches: true,
                eventReminders: true,
                eventRsvps: true,
                system: true,
              },
            },
          },
        });

        createdUsers.set(user.slug, {
          id: created.id,
          firstName: created.firstName,
        });

        // Link user to fitness activities
        const activityRows = user.activities
          .map((slug) => activityIdsBySlug.get(slug))
          .filter((activityId): activityId is number => typeof activityId === 'number')
          .map((activityId) => ({
            userId: created.id,
            activityId,
          }));

        if (activityRows.length) {
          await tx.userFitnessActivity.createMany({
            data: activityRows,
            skipDuplicates: true,
          });
        }
      }
    });

    const names = batch.map((u) => u.firstName).join(', ');
    console.log(`Created demo profiles batch: ${names}`);
  }

  // 4. Create ALL events (main + outer island + extra) with RSVPs
  const allEvents = [...seedEvents, ...outerIslandEvents, ...extraOahuEvents];
  let createdEventCount = 0;
  let createdRsvpCount = 0;
  let createdNotificationCount = 0;
  const createdEventIds = new Map<string, string>();

  for (const event of allEvents) {
    const host = createdUsers.get(event.hostSlug);
    if (!host) continue;

    const startsAt = buildSeedInstant(event.startDayOffset, event.startHour);
    const endsAt = new Date(
      startsAt.getTime() + event.durationHours * 60 * 60 * 1000,
    );

    const createdEvent = await prisma.event.create({
      data: {
        id: stableUuid('seed-event', event.slug),
        title: event.title,
        description: event.description,
        location: event.location,
        category: event.category,
        imageUrl: event.imageUrl,
        startsAt,
        endsAt,
        hostId: host.id,
      },
    });

    createdEventIds.set(event.slug, createdEvent.id);
    createdEventCount += 1;

    // Create RSVPs for host + attendees
    const attendeeIds = [
      host.id,
      ...event.attendeeSlugs
        .map((slug) => createdUsers.get(slug)?.id)
        .filter((userId): userId is string => !!userId),
    ];
    const uniqueAttendeeIds = Array.from(new Set(attendeeIds));

    if (uniqueAttendeeIds.length) {
      const result = await prisma.eventRsvp.createMany({
        data: uniqueAttendeeIds.map((userId) => ({
          eventId: createdEvent.id,
          userId,
        })),
        skipDuplicates: true,
      });
      createdRsvpCount += result.count;
    }

    // Create RSVP notifications for event host
    const rsvpNotifs = await createEventRsvpNotifications(
      prisma,
      createdEvent.id,
      host.id,
      host.firstName,
      uniqueAttendeeIds,
      event.title,
      startsAt,
    );
    createdNotificationCount += rsvpNotifs;

    console.log(
      `Created event: ${createdEvent.title} (${uniqueAttendeeIds.length} RSVPs)`,
    );
  }

  // 5. Create likes + notifications
  let createdLikeCount = 0;

  for (const like of allLikes) {
    const fromUser = createdUsers.get(like.fromSlug);
    const toUser = createdUsers.get(like.toSlug);
    if (!fromUser || !toUser) continue;

    const createdAt = buildSeedInstant(like.dayOffset, like.hour);
    await prisma.like.create({
      data: {
        id: stableUuid('seed-like', like.slug),
        createdAt,
        fromUserId: fromUser.id,
        toUserId: toUser.id,
        isSuperLike: like.isSuperLike ?? false,
      },
    });
    createdLikeCount += 1;
  }

  const likeNotifCount = await createLikeNotifications(prisma, allLikes, createdUsers);
  createdNotificationCount += likeNotifCount;

  // 6. Create passes
  let createdPassCount = 0;

  for (const pass of allPasses) {
    const fromUser = createdUsers.get(pass.fromSlug);
    const toUser = createdUsers.get(pass.toSlug);
    if (!fromUser || !toUser) continue;

    const createdAt = buildSeedInstant(pass.dayOffset, pass.hour);
    await prisma.pass.create({
      data: {
        id: stableUuid('seed-pass', pass.slug),
        createdAt,
        fromUserId: fromUser.id,
        toUserId: toUser.id,
      },
    });
    createdPassCount += 1;
  }

  // 7. Create matches + messages + notifications
  let createdMatchCount = 0;
  let createdMessageCount = 0;
  const createdMatchIds = new Map<string, string>();

  for (const seedMatch of allMatches) {
    const users = seedMatch.userSlugs
      .map((slug) => createdUsers.get(slug))
      .filter((user): user is { id: string; firstName: string } => Boolean(user));
    if (users.length !== 2) continue;

    const [userAId, userBId] = [users[0].id, users[1].id].sort();
    const matchCreatedAt = buildSeedInstant(seedMatch.dayOffset, seedMatch.hour);
    const matchId = stableUuid('seed-match', seedMatch.slug);
    createdMatchIds.set(seedMatch.slug, matchId);

    await prisma.match.create({
      data: {
        id: matchId,
        createdAt: matchCreatedAt,
        updatedAt: matchCreatedAt,
        userAId,
        userBId,
        isDatingMatch: seedMatch.isDatingMatch ?? true,
        isWorkoutMatch: seedMatch.isWorkoutMatch ?? true,
        isArchived: seedMatch.isArchived ?? false,
        isBlocked: seedMatch.isBlocked ?? false,
      },
    });
    createdMatchCount += 1;

    // Match notifications
    const matchNotifCount = await createMatchNotifications(
      prisma,
      seedMatch,
      matchId,
      users,
      matchCreatedAt,
    );
    createdNotificationCount += matchNotifCount;

    // Messages
    for (const message of seedMatch.messages) {
      const sender = createdUsers.get(message.senderSlug);
      if (!sender) continue;

      const msgCreatedAt = new Date(
        matchCreatedAt.getTime() + message.hoursAfterMatch * 60 * 60 * 1000,
      );
      await prisma.message.create({
        data: {
          id: stableUuid('seed-message', seedMatch.slug, message.slug),
          matchId,
          senderId: sender.id,
          body: message.body,
          type: MessageType.TEXT,
          isRead: message.isRead ?? false,
          readAt: message.isRead ? msgCreatedAt : null,
          createdAt: msgCreatedAt,
        },
      });
      createdMessageCount += 1;

      // Message notification
      const recipient = users.find((u) => u.id !== sender.id);
      if (recipient) {
        const msgNotifCount = await createMessageNotifications(
          prisma,
          seedMatch.slug,
          message.slug,
          matchId,
          sender,
          recipient,
          message.body,
          msgCreatedAt,
          message.isRead ?? false,
        );
        createdNotificationCount += msgNotifCount;
      }
    }
  }

  // 8. Create event invites + messages + notifications
  let createdInviteCount = 0;

  for (const invite of allEventInvites) {
    const eventId = createdEventIds.get(invite.eventSlug);
    const matchId = createdMatchIds.get(invite.matchSlug);
    const inviter = createdUsers.get(invite.inviterSlug);
    const invitee = createdUsers.get(invite.inviteeSlug);
    if (!eventId || !matchId || !inviter || !invitee) continue;

    const createdAt = buildSeedInstant(invite.dayOffset, invite.hour);
    await prisma.eventInvite.create({
      data: {
        id: stableUuid('seed-event-invite', invite.slug),
        eventId,
        inviterId: inviter.id,
        inviteeId: invitee.id,
        matchId,
        status: 'pending',
        createdAt,
        updatedAt: createdAt,
      },
    });

    await prisma.message.create({
      data: {
        id: stableUuid('seed-message', invite.slug),
        matchId,
        senderId: inviter.id,
        body: `${invite.body}\n[EVENT_INVITE:${eventId}]`,
        type: MessageType.EVENT_INVITE,
        createdAt,
      },
    });

    const inviteNotifCount = await createEventInviteNotification(
      prisma,
      invite.slug,
      eventId,
      matchId,
      inviter,
      invitee,
      createdAt,
    );
    createdNotificationCount += inviteNotifCount;

    createdInviteCount += 1;
    createdMessageCount += 1;
  }

  // 9. Print summary
  console.log(
    `Seed complete: ${createdUsers.size} users, ${createdEventCount} events, ${createdRsvpCount} RSVPs, ` +
    `${createdMatchCount} matches, ${createdMessageCount} messages, ${createdLikeCount} likes, ${createdPassCount} passes, ` +
    `${createdInviteCount} invites, ${createdNotificationCount} notifications`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
