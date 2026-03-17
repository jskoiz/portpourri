import { PushService } from './push.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock expo-server-sdk
const mockSendPushNotificationsAsync = jest.fn();
const mockIsExpoPushToken = jest.fn();

jest.mock('expo-server-sdk', () => {
  const MockExpo = jest.fn().mockImplementation(() => ({
    sendPushNotificationsAsync: mockSendPushNotificationsAsync,
  }));
  (MockExpo as any).isExpoPushToken = mockIsExpoPushToken;
  return { __esModule: true, default: MockExpo };
});

function makeMockPrisma() {
  return {
    user: {
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;
}

describe('PushService', () => {
  let service: PushService;
  let prisma: ReturnType<typeof makeMockPrisma>;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = makeMockPrisma();
    service = new PushService(prisma);
  });

  it('sends a push notification for a valid token', async () => {
    mockIsExpoPushToken.mockReturnValue(true);
    mockSendPushNotificationsAsync.mockResolvedValue([
      { status: 'ok', id: 'receipt-1' },
    ]);

    await service.sendPushNotification(
      'ExponentPushToken[abc123]',
      'Test Title',
      'Test Body',
      { matchId: 'm-1' },
    );

    expect(mockSendPushNotificationsAsync).toHaveBeenCalledWith([
      {
        to: 'ExponentPushToken[abc123]',
        sound: 'default',
        title: 'Test Title',
        body: 'Test Body',
        data: { matchId: 'm-1' },
      },
    ]);
  });

  it('skips sending when the token is invalid', async () => {
    mockIsExpoPushToken.mockReturnValue(false);

    await service.sendPushNotification(
      'bad-token',
      'Title',
      'Body',
    );

    expect(mockSendPushNotificationsAsync).not.toHaveBeenCalled();
  });

  it('clears the push token on DeviceNotRegistered error', async () => {
    mockIsExpoPushToken.mockReturnValue(true);
    mockSendPushNotificationsAsync.mockResolvedValue([
      {
        status: 'error',
        message: 'Device not registered',
        details: { error: 'DeviceNotRegistered' },
      },
    ]);

    await service.sendPushNotification(
      'ExponentPushToken[expired]',
      'Title',
      'Body',
    );

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { pushToken: 'ExponentPushToken[expired]' },
      data: { pushToken: null },
    });
  });

  it('does not clear the token for non-DeviceNotRegistered errors', async () => {
    mockIsExpoPushToken.mockReturnValue(true);
    mockSendPushNotificationsAsync.mockResolvedValue([
      {
        status: 'error',
        message: 'Message too big',
        details: { error: 'MessageTooBig' },
      },
    ]);

    await service.sendPushNotification(
      'ExponentPushToken[valid]',
      'Title',
      'Body',
    );

    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('handles expo SDK errors gracefully without throwing', async () => {
    mockIsExpoPushToken.mockReturnValue(true);
    mockSendPushNotificationsAsync.mockRejectedValue(
      new Error('Network error'),
    );

    // Should not throw
    await service.sendPushNotification(
      'ExponentPushToken[abc]',
      'Title',
      'Body',
    );

    expect(mockSendPushNotificationsAsync).toHaveBeenCalled();
  });

  it('sends empty data object when data is not provided', async () => {
    mockIsExpoPushToken.mockReturnValue(true);
    mockSendPushNotificationsAsync.mockResolvedValue([
      { status: 'ok', id: 'receipt-2' },
    ]);

    await service.sendPushNotification(
      'ExponentPushToken[abc123]',
      'Title',
      'Body',
    );

    expect(mockSendPushNotificationsAsync).toHaveBeenCalledWith([
      expect.objectContaining({ data: {} }),
    ]);
  });
});
