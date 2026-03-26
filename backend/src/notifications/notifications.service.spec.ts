import { NotificationsService } from './notifications.service';
import { NotificationType } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './push.service';

function makeMockPrisma() {
  return {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    match: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    report: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    notificationPreferences: {
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;
}

function makeMockPushService() {
  return {
    sendPushNotification: jest.fn().mockResolvedValue({ outcome: 'delivered', pushToken: 'token' }),
  } as unknown as PushService;
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: ReturnType<typeof makeMockPrisma>;
  let pushService: ReturnType<typeof makeMockPushService>;

  beforeEach(() => {
    prisma = makeMockPrisma();
    pushService = makeMockPushService();
    service = new NotificationsService(prisma, pushService);
  });

  it('creates a notification via prisma', async () => {
    const mockNotification = {
      id: 'uuid-1',
      userId: 'user-1',
      type: 'system',
      title: 'Hello',
      body: 'World',
      data: null,
      read: false,
      readAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prisma.notification.create as jest.Mock).mockResolvedValue(
      mockNotification,
    );

    const n = await service.create('user-1', {
      type: NotificationType.System,
      title: 'Hello',
      body: 'World',
    });

    expect(n).not.toBeNull();
    expect(n?.id).toBeTruthy();
    expect(n?.createdAt).toBeInstanceOf(Date);
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        type: NotificationType.System,
        title: 'Hello',
        body: 'World',
        data: { type: NotificationType.System },
      },
    });
  });

  it('dispatches push for event invite notifications when payload is complete', async () => {
    const mockNotification = {
      id: 'uuid-3',
      userId: 'user-1',
      type: NotificationType.EventInvite,
      title: 'Event invite',
      body: 'Mia invited you to Sunrise Run',
      data: {
        eventId: 'event-1',
        matchId: 'match-9',
        withUserId: 'user-4',
        type: NotificationType.EventInvite,
      },
      read: false,
      readAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prisma.notification.create as jest.Mock).mockResolvedValue(
      mockNotification,
    );

    await service.create('user-1', {
      type: NotificationType.EventInvite,
      title: 'Event invite',
      body: 'Mia invited you to Sunrise Run',
      data: {
        eventId: 'event-1',
        matchId: 'match-9',
        withUserId: 'user-4',
      },
    });

    expect(pushService.sendPushNotification).toHaveBeenCalledWith(
      'token',
      'Event invite',
      'Mia invited you to Sunrise Run',
      {
        eventId: 'event-1',
        matchId: 'match-9',
        notificationId: 'uuid-3',
        type: NotificationType.EventInvite,
        withUserId: 'user-4',
      },
    );
  });

  it('does not dispatch push for event reminder notifications', async () => {
    const mockNotification = {
      id: 'uuid-3b',
      userId: 'user-1',
      type: NotificationType.EventReminder,
      title: 'Event joined',
      body: 'You are in for Sunrise Run',
      data: { eventId: 'event-1', type: NotificationType.EventReminder },
      read: false,
      readAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prisma.notification.create as jest.Mock).mockResolvedValue(
      mockNotification,
    );

    await service.create('user-1', {
      type: NotificationType.EventReminder,
      title: 'Event joined',
      body: 'You are in for Sunrise Run',
      data: { eventId: 'event-1' },
    });

    expect(pushService.sendPushNotification).not.toHaveBeenCalled();
  });

  it('skips push dispatch when a push-eligible notification payload is malformed', async () => {
    const mockNotification = {
      id: 'uuid-4',
      userId: 'user-1',
      type: NotificationType.MatchCreated,
      title: "It's a match!",
      body: 'You can start chatting now.',
      data: { type: NotificationType.MatchCreated },
      read: false,
      readAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

    await service.create('user-1', {
      type: NotificationType.MatchCreated,
      title: "It's a match!",
      body: 'You can start chatting now.',
      data: {} as Record<string, unknown>,
    });

    expect(pushService.sendPushNotification).not.toHaveBeenCalled();
  });

  it('lists notifications via prisma', async () => {
    (prisma.notification.findMany as jest.Mock).mockResolvedValue([
      { id: '1', title: 'B' },
      { id: '2', title: 'A' },
    ]);

    const list = await service.list('user-1');
    expect(list).toHaveLength(2);
    expect(list[0].title).toBe('B');
    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });

  it('applies the upper bound and cursor when listing notifications', async () => {
    (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

    await service.list('user-1', 250, 'cursor-1');

    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      skip: 1,
      cursor: { id: 'cursor-1' },
    });
  });

  it('marks a single notification as read', async () => {
    const existing = { id: 'n-1', userId: 'user-1', read: false, readAt: null };
    (prisma.notification.findFirst as jest.Mock).mockResolvedValue(existing);
    const updated = { ...existing, read: true, readAt: new Date() };
    (prisma.notification.update as jest.Mock).mockResolvedValue(updated);

    const result = await service.markRead('user-1', 'n-1');
    expect(result?.readAt).toBeInstanceOf(Date);
  });

  it('throws NotFoundException when marking unknown notification as read', async () => {
    (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.markRead('user-1', 'non-existent-id'),
    ).rejects.toThrow('Notification non-existent-id not found');
  });

  it('marks all unread notifications as read', async () => {
    (prisma.notification.updateMany as jest.Mock).mockResolvedValue({
      count: 2,
    });

    const { updated } = await service.markAllRead('user-1');
    expect(updated).toBe(2);
  });

  it('markAllRead returns 0 when all notifications are already read', async () => {
    (prisma.notification.updateMany as jest.Mock).mockResolvedValue({
      count: 0,
    });

    const { updated } = await service.markAllRead('user-1');
    expect(updated).toBe(0);
  });

  it('getUnreadCount returns count from prisma', async () => {
    (prisma.notification.count as jest.Mock).mockResolvedValue(5);

    const count = await service.getUnreadCount('user-1');
    expect(count).toBe(5);
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { userId: 'user-1', read: false },
    });
  });

  it('suppresses notification when recipient has blocked the source user via match', async () => {
    (prisma.match.findFirst as jest.Mock).mockResolvedValue({ id: 'blocked-match' });

    const result = await service.create('user-1', {
      type: NotificationType.LikeReceived,
      title: 'New like',
      body: 'Someone liked you',
      sourceUserId: 'blocked-user',
    });

    expect(result).toBeNull();
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('suppresses notification when recipient has blocked the source user via report', async () => {
    (prisma.match.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.report.findFirst as jest.Mock).mockResolvedValue({ id: 'block-report' });

    const result = await service.create('user-1', {
      type: NotificationType.LikeReceived,
      title: 'New like',
      body: 'Someone liked you',
      sourceUserId: 'blocked-user',
    });

    expect(result).toBeNull();
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('does not suppress notification when no block relationship exists', async () => {
    (prisma.match.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.report.findFirst as jest.Mock).mockResolvedValue(null);

    const mockNotification = {
      id: 'uuid-2',
      userId: 'user-1',
      type: NotificationType.LikeReceived,
      title: 'New like',
      body: 'Someone liked you',
      data: null,
      read: false,
      readAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

    const result = await service.create('user-1', {
      type: NotificationType.LikeReceived,
      title: 'New like',
      body: 'Someone liked you',
      sourceUserId: 'normal-user',
    });

    expect(result).not.toBeNull();
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  describe('isNotificationEnabled', () => {
    it('returns true when no preferences row exists', async () => {
      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue(null);

      const enabled = await service.isNotificationEnabled('user-1', NotificationType.MatchCreated);
      expect(enabled).toBe(true);
    });

    it('returns true when user has the preference enabled', async () => {
      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue({
        matches: true,
        messages: true,
        likes: true,
        eventReminders: true,
        eventRsvps: true,
        system: true,
      });

      const enabled = await service.isNotificationEnabled('user-1', NotificationType.MatchCreated);
      expect(enabled).toBe(true);
    });

    it('returns false when user has the preference disabled', async () => {
      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue({
        matches: false,
        messages: true,
        likes: true,
        eventReminders: true,
        eventRsvps: true,
        system: true,
      });

      const enabled = await service.isNotificationEnabled('user-1', NotificationType.MatchCreated);
      expect(enabled).toBe(false);
    });

    it('maps message_received to the messages preference', async () => {
      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue({
        matches: true,
        messages: false,
        likes: true,
        eventReminders: true,
        eventRsvps: true,
        system: true,
      });

      const enabled = await service.isNotificationEnabled('user-1', NotificationType.MessageReceived);
      expect(enabled).toBe(false);
    });

    it('maps like_received to the likes preference', async () => {
      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue({
        matches: true,
        messages: true,
        likes: false,
        eventReminders: true,
        eventRsvps: true,
        system: true,
      });

      const enabled = await service.isNotificationEnabled('user-1', NotificationType.LikeReceived);
      expect(enabled).toBe(false);
    });

    it('maps event_rsvp to the eventRsvps preference', async () => {
      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue({
        matches: true,
        messages: true,
        likes: true,
        eventReminders: true,
        eventRsvps: false,
        system: true,
      });

      const enabled = await service.isNotificationEnabled('user-1', NotificationType.EventRsvp);
      expect(enabled).toBe(false);
    });

    it('maps event_reminder to the eventReminders preference', async () => {
      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue({
        matches: true,
        messages: true,
        likes: true,
        eventReminders: false,
        eventRsvps: true,
        system: true,
      });

      const enabled = await service.isNotificationEnabled('user-1', NotificationType.EventReminder);
      expect(enabled).toBe(false);
    });

    it('maps event_invite to the eventReminders preference', async () => {
      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue({
        matches: true,
        messages: true,
        likes: true,
        eventReminders: false,
        eventRsvps: true,
        system: true,
      });

      const enabled = await service.isNotificationEnabled('user-1', NotificationType.EventInvite);
      expect(enabled).toBe(false);
    });

    it('maps event_reminder to the eventReminders preference', async () => {
      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue({
        matches: true,
        messages: true,
        likes: true,
        eventReminders: false,
        eventRsvps: true,
        system: true,
      });

      const enabled = await service.isNotificationEnabled('user-1', NotificationType.EventReminder);
      expect(enabled).toBe(false);
    });
  });

  describe('dispatchPush', () => {
    it('sends push notifications for event reminders', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        pushToken: 'ExponentPushToken[abc]',
        notificationPreferences: {
          matches: true,
          messages: true,
          likes: true,
          eventReminders: true,
          eventRsvps: true,
          system: true,
        },
      });

      await (service as any).dispatchPush({
        id: 'notif-1',
        userId: 'user-1',
        type: 'event_reminder',
        title: 'Event invite',
        body: 'Join us',
        data: { type: 'event_invite', eventId: 'event-1', matchId: 'match-1' },
      });

      expect(pushService.sendPushNotification).toHaveBeenCalledWith(
        'ExponentPushToken[abc]',
        'Event invite',
        'Join us',
        { type: 'event_invite', eventId: 'event-1', matchId: 'match-1' },
      );
    });
  });
});
