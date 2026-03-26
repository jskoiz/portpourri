import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  EventInviteListSchema,
  EventInviteResponseSchema,
  EventListSchema,
  EventRsvpResponseSchema,
  EventSummarySchema,
} from '@contracts';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';

function expectSchema<T>(schema: { parse: (value: unknown) => T }, value: unknown) {
  expect(() => schema.parse(value)).not.toThrow();
}

describe('EventsController', () => {
  let controller: EventsController;

  const eventsServiceMock = {
    list: jest.fn(),
    myEvents: jest.fn(),
    detail: jest.fn(),
    create: jest.fn(),
    rsvp: jest.fn(),
    invite: jest.fn(),
    getInvites: jest.fn(),
  };

  const eventSummaryFixture = {
    id: 'event-1',
    title: 'Yoga',
    description: 'Morning flow',
    location: 'Studio A',
    imageUrl: null,
    category: 'wellness',
    startsAt: '2026-07-01T10:00:00Z',
    endsAt: '2026-07-01T11:00:00Z',
    host: { id: 'user-1', firstName: 'Ava' },
    attendeesCount: 6,
    joined: true,
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
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    eventsServiceMock.list.mockResolvedValue([]);

    const result = await controller.list(req, undefined, undefined);
    expect(result).toEqual([]);
    expectSchema(EventListSchema, result);
    expect(eventsServiceMock.list).toHaveBeenCalledWith('user-1', 20, 0);
  });

  it('parses provided pagination params before delegating', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    eventsServiceMock.list.mockResolvedValue([]);

    const result = await controller.list(req, '12', '4');
    expect(result).toEqual([]);
    expectSchema(EventListSchema, result);
    expect(eventsServiceMock.list).toHaveBeenCalledWith('user-1', 12, 4);
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
    eventsServiceMock.create.mockResolvedValue(eventSummaryFixture);

    const result = await controller.create(payload, req);
    expect(result).toEqual(eventSummaryFixture);
    expectSchema(EventSummarySchema, result);
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

    const result = await controller.rsvp('event-1', req);
    expect(result).toEqual({
      status: 'joined',
      attendeesCount: 6,
    });
    expectSchema(EventRsvpResponseSchema, result);
    expect(eventsServiceMock.rsvp).toHaveBeenCalledWith('event-1', 'user-1');
  });

  it('delegates invite to events service', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    const payload = { matchId: 'match-1', message: 'Want to join?' };
    const invite = {
      id: 'invite-1',
      status: 'pending',
      event: {
        id: 'event-1',
        title: 'Yoga',
        location: 'Studio A',
        startsAt: '2026-07-01T10:00:00Z',
        endsAt: '2026-07-01T11:00:00Z',
        category: 'wellness',
        host: { id: 'user-1', firstName: 'Ava' },
        attendeesCount: 6,
      },
    };
    eventsServiceMock.invite.mockResolvedValue(invite);

    const result = await controller.invite('event-1', payload, req);
    expect(result).toEqual(invite);
    expectSchema(EventInviteResponseSchema, result);
    expect(eventsServiceMock.invite).toHaveBeenCalledWith(
      'event-1',
      'user-1',
      'match-1',
      'Want to join?',
    );
  });

  it('delegates getInvites to events service', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    const invites = [
      {
        id: 'invite-1',
        status: 'pending',
        createdAt: '2026-07-01T09:00:00Z',
        inviter: { id: 'user-1', firstName: 'Ava' },
        invitee: { id: 'user-2', firstName: 'Noah' },
      },
    ];
    eventsServiceMock.getInvites.mockResolvedValue(invites);

    const result = await controller.getInvites('event-1', req);
    expect(result).toEqual(invites);
    expectSchema(EventInviteListSchema, result);
    expect(eventsServiceMock.getInvites).toHaveBeenCalledWith('event-1', 'user-1');
  });

  it('delegates myEvents to events service', async () => {
    const req = {
      user: { id: 'user-1', email: 'u@example.com' },
    } as AuthenticatedRequest;
    eventsServiceMock.myEvents.mockResolvedValue([]);

    const result = await controller.myEvents(req);
    expect(result).toEqual([]);
    expectSchema(EventListSchema, result);
    expect(eventsServiceMock.myEvents).toHaveBeenCalledWith('user-1', 20, 0);
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
    eventsServiceMock.detail.mockResolvedValue(eventSummaryFixture);

    const result = await controller.detail('event-1', req);
    expect(result).toEqual(eventSummaryFixture);
    expectSchema(EventSummarySchema, result);
    expect(eventsServiceMock.detail).toHaveBeenCalledWith('event-1', 'user-1');
  });
});
