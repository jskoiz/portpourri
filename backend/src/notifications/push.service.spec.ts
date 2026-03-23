import { PushService } from './push.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  mockIsExpoPushToken,
  mockSendPushNotificationsAsync,
} from '../test-support/expo-server-sdk.mock';

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

    const result = await service.sendPushNotification(
      'ExponentPushToken[abc123]',
      'Test Title',
      'Test Body',
      { matchId: 'm-1' },
    );

    expect(result.outcome).toBe('delivered');
    expect(result.pushToken).toBe('ExponentPushToken[abc123]');
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

  it('returns token_invalid when the token is invalid', async () => {
    mockIsExpoPushToken.mockReturnValue(false);

    const result = await service.sendPushNotification(
      'bad-token',
      'Title',
      'Body',
    );

    expect(result.outcome).toBe('token_invalid');
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

    const result = await service.sendPushNotification(
      'ExponentPushToken[expired]',
      'Title',
      'Body',
    );

    expect(result.outcome).toBe('device_not_registered');
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { pushToken: 'ExponentPushToken[expired]' },
      data: { pushToken: null },
    });
  });

  it('returns delivery_failed for non-DeviceNotRegistered ticket errors', async () => {
    mockIsExpoPushToken.mockReturnValue(true);
    mockSendPushNotificationsAsync.mockResolvedValue([
      {
        status: 'error',
        message: 'Message too big',
        details: { error: 'MessageTooBig' },
      },
    ]);

    const result = await service.sendPushNotification(
      'ExponentPushToken[valid]',
      'Title',
      'Body',
    );

    expect(result.outcome).toBe('delivery_failed');
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('retries on transient errors with exponential backoff', async () => {
    mockIsExpoPushToken.mockReturnValue(true);
    mockSendPushNotificationsAsync
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce([{ status: 'ok', id: 'receipt-2' }]);

    const result = await service.sendPushNotification(
      'ExponentPushToken[abc]',
      'Title',
      'Body',
    );

    expect(result.outcome).toBe('delivered');
    expect(result.attempt).toBe(2);
    expect(mockSendPushNotificationsAsync).toHaveBeenCalledTimes(2);
  });

  it('returns send_error after exhausting all retries', async () => {
    mockIsExpoPushToken.mockReturnValue(true);
    mockSendPushNotificationsAsync.mockRejectedValue(
      new Error('Persistent network error'),
    );

    const result = await service.sendPushNotification(
      'ExponentPushToken[abc]',
      'Title',
      'Body',
    );

    expect(result.outcome).toBe('send_error');
    expect(result.attempt).toBe(3);
    expect(result.error).toBe('Persistent network error');
    expect(mockSendPushNotificationsAsync).toHaveBeenCalledTimes(3);
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
