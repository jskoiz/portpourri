import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';

describe('EventsController', () => {
  let controller: EventsController;

  const eventsServiceMock = {
    list: jest.fn(),
    myEvents: jest.fn(),
    detail: jest.fn(),
    create: jest.fn(),
    rsvp: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: eventsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
  });

  it('defaults pagination at the controller boundary', async () => {
    eventsServiceMock.list.mockResolvedValue([]);

    await expect(controller.list(undefined, undefined)).resolves.toEqual([]);
    expect(eventsServiceMock.list).toHaveBeenCalledWith(undefined, 20, 0);
  });

  it('parses provided pagination params before delegating', async () => {
    eventsServiceMock.list.mockResolvedValue([]);

    await expect(controller.list('12', '4')).resolves.toEqual([]);
    expect(eventsServiceMock.list).toHaveBeenCalledWith(undefined, 12, 4);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates create to events service', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    const payload = {
      title: 'Yoga',
      location: 'Studio A',
      startsAt: '2026-07-01T10:00:00Z',
    };
    eventsServiceMock.create.mockResolvedValue({
      id: 'event-1',
      title: 'Yoga',
    });

    await expect(controller.create(payload, req)).resolves.toEqual({
      id: 'event-1',
      title: 'Yoga',
    });
    expect(eventsServiceMock.create).toHaveBeenCalledWith(payload, 'user-1');
  });

  it('delegates rsvp to events service', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    eventsServiceMock.rsvp.mockResolvedValue({
      status: 'joined',
      attendeesCount: 6,
    });

    await expect(controller.rsvp('event-1', req)).resolves.toEqual({
      status: 'joined',
      attendeesCount: 6,
    });
    expect(eventsServiceMock.rsvp).toHaveBeenCalledWith('event-1', 'user-1');
  });

  it('delegates myEvents to events service', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    eventsServiceMock.myEvents.mockResolvedValue([]);

    await expect(controller.myEvents(req)).resolves.toEqual([]);
    expect(eventsServiceMock.myEvents).toHaveBeenCalledWith('user-1');
  });

  it('propagates NotFoundException from detail', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    eventsServiceMock.detail.mockRejectedValue(
      new NotFoundException('Event not found'),
    );

    await expect(controller.detail('missing', req)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('delegates event detail lookups with the authenticated user id', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    eventsServiceMock.detail.mockResolvedValue({ id: 'event-1', joined: true });

    await expect(controller.detail('event-1', req)).resolves.toEqual({
      id: 'event-1',
      joined: true,
    });
    expect(eventsServiceMock.detail).toHaveBeenCalledWith('event-1', 'user-1');
  });
});
