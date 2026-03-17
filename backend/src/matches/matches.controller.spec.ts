import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';

describe('MatchesController', () => {
  let controller: MatchesController;

  const matchesServiceMock = {
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

  it('delegates getMatches to service', async () => {
    matchesServiceMock.getMatches.mockResolvedValue([]);
    const result = await controller.getMatches(req);
    expect(matchesServiceMock.getMatches).toHaveBeenCalledWith('user-1', 20, 0);
    expect(result).toEqual([]);
  });

  it('parses pagination query params before delegating getMatches', async () => {
    matchesServiceMock.getMatches.mockResolvedValue([]);
    const result = await controller.getMatches(req, '5', '10');
    expect(matchesServiceMock.getMatches).toHaveBeenCalledWith('user-1', 5, 10);
    expect(result).toEqual([]);
  });

  it('delegates getMessages to service', async () => {
    matchesServiceMock.getMessages.mockResolvedValue([]);
    const result = await controller.getMessages(req, 'match-1');
    expect(matchesServiceMock.getMessages).toHaveBeenCalledWith(
      'match-1',
      'user-1',
      50,
      undefined,
    );
    expect(result).toEqual([]);
  });

  it('delegates streamMessages to service', async () => {
    const fakeStream = {} as any;
    matchesServiceMock.streamMessages.mockResolvedValue(fakeStream);
    const result = await controller.streamMessages(req, 'match-1');
    expect(matchesServiceMock.streamMessages).toHaveBeenCalledWith(
      'match-1',
      'user-1',
    );
    expect(result).toBe(fakeStream);
  });

  it('propagates ForbiddenException from getMessages', async () => {
    matchesServiceMock.getMessages.mockRejectedValue(
      new ForbiddenException('Access denied'),
    );

    await expect(controller.getMessages(req, 'match-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  describe('getMatches pagination bounds', () => {
    beforeEach(() => matchesServiceMock.getMatches.mockResolvedValue([]));

    it('defaults take=20 and skip=0 for NaN strings', async () => {
      await controller.getMatches(req, 'abc', 'xyz');
      expect(matchesServiceMock.getMatches).toHaveBeenCalledWith('user-1', 20, 0);
    });

    it('clamps take to minimum 1 when 0', async () => {
      await controller.getMatches(req, '0', '0');
      expect(matchesServiceMock.getMatches).toHaveBeenCalledWith('user-1', 1, 0);
    });

    it('clamps negative take to 1', async () => {
      await controller.getMatches(req, '-5', '0');
      expect(matchesServiceMock.getMatches).toHaveBeenCalledWith('user-1', 1, 0);
    });

    it('clamps take to maximum 100', async () => {
      await controller.getMatches(req, '999', '0');
      expect(matchesServiceMock.getMatches).toHaveBeenCalledWith('user-1', 100, 0);
    });

    it('clamps negative skip to 0', async () => {
      await controller.getMatches(req, '10', '-10');
      expect(matchesServiceMock.getMatches).toHaveBeenCalledWith('user-1', 10, 0);
    });
  });

  describe('getMessages pagination bounds', () => {
    beforeEach(() => matchesServiceMock.getMessages.mockResolvedValue([]));

    it('defaults take=50 for NaN string', async () => {
      await controller.getMessages(req, 'match-1', 'abc');
      expect(matchesServiceMock.getMessages).toHaveBeenCalledWith(
        'match-1', 'user-1', 50, undefined,
      );
    });

    it('clamps take to minimum 1 when 0', async () => {
      await controller.getMessages(req, 'match-1', '0');
      expect(matchesServiceMock.getMessages).toHaveBeenCalledWith(
        'match-1', 'user-1', 1, undefined,
      );
    });

    it('clamps negative take to 1', async () => {
      await controller.getMessages(req, 'match-1', '-5');
      expect(matchesServiceMock.getMessages).toHaveBeenCalledWith(
        'match-1', 'user-1', 1, undefined,
      );
    });

    it('clamps take to maximum 100', async () => {
      await controller.getMessages(req, 'match-1', '500');
      expect(matchesServiceMock.getMessages).toHaveBeenCalledWith(
        'match-1', 'user-1', 100, undefined,
      );
    });
  });

  it('delegates sendMessage to service', async () => {
    const msg = {
      id: 'msg-1',
      text: 'hi',
      sender: 'me',
      timestamp: new Date(),
    };
    matchesServiceMock.sendMessage.mockResolvedValue(msg);
    const result = await controller.sendMessage(req, 'match-1', {
      content: 'hi',
    });
    expect(matchesServiceMock.sendMessage).toHaveBeenCalledWith(
      'match-1',
      'user-1',
      'hi',
    );
    expect(result).toBe(msg);
  });
});
