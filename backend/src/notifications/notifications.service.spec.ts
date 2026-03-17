import { NotificationsService } from './notifications.service';
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
  } as unknown as PrismaService;
}

function makeMockPushService() {
  return {
    sendPushNotification: jest.fn().mockResolvedValue(undefined),
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
      type: 'system',
      title: 'Hello',
      body: 'World',
    });

    expect(n.id).toBeTruthy();
    expect(n.createdAt).toBeInstanceOf(Date);
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        type: 'system',
        title: 'Hello',
        body: 'World',
        data: undefined,
      },
    });
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
});
