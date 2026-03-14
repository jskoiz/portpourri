import { Test, TestingModule } from '@nestjs/testing';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';

describe('MatchesController', () => {
  let controller: MatchesController;

  const matchesServiceMock = {
    likeUser: jest.fn(),
    getMatches: jest.fn(),
    getMessages: jest.fn(),
    streamMessages: jest.fn(),
    sendMessage: jest.fn(),
  };

  const req = { user: { id: 'user-1' } } as AuthenticatedRequest;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchesController],
      providers: [{ provide: MatchesService, useValue: matchesServiceMock }],
    }).compile();

    controller = module.get<MatchesController>(MatchesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates likeUser to service', async () => {
    matchesServiceMock.likeUser.mockResolvedValue({ isMatch: false });
    const result = await controller.likeUser(req, { toUserId: 'user-2' });
    expect(matchesServiceMock.likeUser).toHaveBeenCalledWith('user-1', 'user-2');
    expect(result).toEqual({ isMatch: false });
  });

  it('delegates getMatches to service', async () => {
    matchesServiceMock.getMatches.mockResolvedValue([]);
    const result = await controller.getMatches(req);
    expect(matchesServiceMock.getMatches).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([]);
  });

  it('delegates getMessages to service', async () => {
    matchesServiceMock.getMessages.mockResolvedValue([]);
    const result = await controller.getMessages(req, 'match-1');
    expect(matchesServiceMock.getMessages).toHaveBeenCalledWith('match-1', 'user-1');
    expect(result).toEqual([]);
  });

  it('delegates streamMessages to service', async () => {
    const fakeStream = {} as any;
    matchesServiceMock.streamMessages.mockResolvedValue(fakeStream);
    const result = await controller.streamMessages(req, 'match-1');
    expect(matchesServiceMock.streamMessages).toHaveBeenCalledWith('match-1', 'user-1');
    expect(result).toBe(fakeStream);
  });

  it('delegates sendMessage to service', async () => {
    const msg = { id: 'msg-1', text: 'hi', sender: 'me', timestamp: new Date() };
    matchesServiceMock.sendMessage.mockResolvedValue(msg);
    const result = await controller.sendMessage(req, 'match-1', { content: 'hi' });
    expect(matchesServiceMock.sendMessage).toHaveBeenCalledWith('match-1', 'user-1', 'hi');
    expect(result).toBe(msg);
  });
});
