import { Test, TestingModule } from '@nestjs/testing';
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
