import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationType } from '../common/enums';
import type { AuthenticatedRequest } from '../common/auth-request.interface';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const notificationsServiceMock = {
    list: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
    create: jest.fn(),
  };

  const req = { user: { id: 'user-1' } } as AuthenticatedRequest;

  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: notificationsServiceMock },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates list to notifications service', async () => {
    notificationsServiceMock.list.mockResolvedValue([]);
    const result = await controller.list(req);
    expect(notificationsServiceMock.list).toHaveBeenCalledWith('user-1', 50, undefined);
    expect(result).toEqual([]);
  });

  it('delegates markRead to notifications service', async () => {
    const notification = { id: 'n-1', readAt: new Date() };
    notificationsServiceMock.markRead.mockResolvedValue(notification);
    const result = await controller.markRead(req, 'n-1');
    expect(notificationsServiceMock.markRead).toHaveBeenCalledWith(
      'user-1',
      'n-1',
    );
    expect(result).toBe(notification);
  });

  it('throws NotFoundException when markRead returns null (notification not found)', async () => {
    notificationsServiceMock.markRead.mockResolvedValue(null);
    await expect(controller.markRead(req, 'non-existent-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('delegates markAllRead to notifications service', async () => {
    notificationsServiceMock.markAllRead.mockResolvedValue({ updated: 3 });
    const result = await controller.markAllRead(req);
    expect(notificationsServiceMock.markAllRead).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ updated: 3 });
  });

  it('throws ForbiddenException when NODE_ENV is production', async () => {
    process.env.NODE_ENV = 'production';

    await expect(
      controller.emit(req, {
        type: NotificationType.System,
        title: 'Test',
        body: 'test',
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(notificationsServiceMock.create).not.toHaveBeenCalled();
  });

  it('delegates emit with a valid type to notifications service', async () => {
    const notification = { id: 'n-2' };
    notificationsServiceMock.create.mockResolvedValue(notification);

    const body = {
      type: NotificationType.MatchCreated,
      title: 'Match!',
      body: 'You matched',
    };
    const result = await controller.emit(req, body);

    expect(notificationsServiceMock.create).toHaveBeenCalledWith('user-1', {
      type: 'match_created',
      title: 'Match!',
      body: 'You matched',
      data: undefined,
    });
    expect(result).toBe(notification);
  });

  it('passes the validated notification type directly to the service', async () => {
    notificationsServiceMock.create.mockResolvedValue({ id: 'n-3' });

    await controller.emit(req, {
      type: NotificationType.System,
      title: 'Hey',
      body: 'test',
    });

    expect(notificationsServiceMock.create).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ type: NotificationType.System }),
    );
  });
});
