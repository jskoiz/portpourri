/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as jwt from 'jsonwebtoken';
import { ChatGateway } from './chat.gateway';
import { MatchesService } from './matches.service';
import { appConfig } from '../config/app.config';

function createMockSocket(overrides: Record<string, unknown> = {}) {
  return {
    id: 'socket-1',
    handshake: {
      auth: {},
      query: {},
      headers: {},
    },
    data: {},
    emit: jest.fn(),
    join: jest.fn().mockResolvedValue(undefined),
    leave: jest.fn().mockResolvedValue(undefined),
    to: jest.fn().mockReturnThis(),
    disconnect: jest.fn(),
    ...overrides,
  } as any;
}

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let matchesService: jest.Mocked<MatchesService>;
  let mockServer: any;

  const validToken = jwt.sign(
    { sub: 'user-1', email: 'user@test.com' },
    appConfig.jwt.secret,
    { expiresIn: '1h' },
  );

  beforeEach(() => {
    matchesService = {
      getMessages: jest.fn().mockResolvedValue([]),
      sendMessage: jest.fn(),
    } as any;

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    gateway = new ChatGateway(matchesService);
    gateway.server = mockServer;
  });

  describe('handleConnection', () => {
    it('authenticates a client with a valid token in auth', async () => {
      const socket = createMockSocket({
        handshake: { auth: { token: validToken }, query: {}, headers: {} },
      });

      await gateway.handleConnection(socket);

      expect(socket.data.userId).toBe('user-1');
      expect(socket.data.email).toBe('user@test.com');
      expect(socket.disconnect).not.toHaveBeenCalled();
    });

    it('authenticates a client with a token in query param', async () => {
      const socket = createMockSocket({
        handshake: { auth: {}, query: { token: validToken }, headers: {} },
      });

      await gateway.handleConnection(socket);

      expect(socket.data.userId).toBe('user-1');
      expect(socket.disconnect).not.toHaveBeenCalled();
    });

    it('authenticates a client with a Bearer token in headers', async () => {
      const socket = createMockSocket({
        handshake: {
          auth: {},
          query: {},
          headers: { authorization: `Bearer ${validToken}` },
        },
      });

      await gateway.handleConnection(socket);

      expect(socket.data.userId).toBe('user-1');
      expect(socket.disconnect).not.toHaveBeenCalled();
    });

    it('rejects a client with no token', async () => {
      const socket = createMockSocket();

      await gateway.handleConnection(socket);

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Authentication failed',
      });
      expect(socket.disconnect).toHaveBeenCalledWith(true);
    });

    it('rejects a client with an invalid token', async () => {
      const socket = createMockSocket({
        handshake: { auth: { token: 'invalid-token' }, query: {}, headers: {} },
      });

      await gateway.handleConnection(socket);

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Authentication failed',
      });
      expect(socket.disconnect).toHaveBeenCalledWith(true);
    });

    it('rejects a client with an expired token', async () => {
      const expiredToken = jwt.sign(
        { sub: 'user-1', email: 'user@test.com' },
        appConfig.jwt.secret,
        { expiresIn: '0s' },
      );

      const socket = createMockSocket({
        handshake: { auth: { token: expiredToken }, query: {}, headers: {} },
      });

      // Small delay so the token is actually expired
      await new Promise((r) => setTimeout(r, 10));
      await gateway.handleConnection(socket);

      expect(socket.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe('handleJoinMatch', () => {
    it('joins the room when user has match access', async () => {
      const socket = createMockSocket();
      socket.data = { userId: 'user-1', email: 'user@test.com' };

      await gateway.handleJoinMatch(socket, { matchId: 'match-1' });

      expect(matchesService.getMessages).toHaveBeenCalledWith('match-1', 'user-1', 1);
      expect(socket.join).toHaveBeenCalledWith('match:match-1');
      expect(socket.emit).toHaveBeenCalledWith('joined:match', { matchId: 'match-1' });
    });

    it('rejects join when user does not have match access', async () => {
      const socket = createMockSocket();
      socket.data = { userId: 'user-1', email: 'user@test.com' };
      matchesService.getMessages.mockRejectedValueOnce(new Error('Access denied'));

      await gateway.handleJoinMatch(socket, { matchId: 'match-1' });

      expect(socket.join).not.toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Cannot join this match room',
      });
    });

    it('rejects join when client is not authenticated', async () => {
      const socket = createMockSocket();
      socket.data = {};

      await gateway.handleJoinMatch(socket, { matchId: 'match-1' });

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Not authenticated',
      });
    });
  });

  describe('handleLeaveMatch', () => {
    it('leaves the room', async () => {
      const socket = createMockSocket();
      socket.data = { userId: 'user-1', email: 'user@test.com' };

      await gateway.handleLeaveMatch(socket, { matchId: 'match-1' });

      expect(socket.leave).toHaveBeenCalledWith('match:match-1');
      expect(socket.emit).toHaveBeenCalledWith('left:match', { matchId: 'match-1' });
    });
  });

  describe('handleSendMessage', () => {
    it('persists and broadcasts the message to the room', async () => {
      const socket = createMockSocket();
      socket.data = { userId: 'user-1', email: 'user@test.com' };
      const savedMessage = {
        id: 'msg-1',
        text: 'hello',
        sender: 'me' as const,
        timestamp: new Date(),
      };
      matchesService.sendMessage.mockResolvedValue(savedMessage);

      await gateway.handleSendMessage(socket, {
        matchId: 'match-1',
        content: 'hello',
      });

      expect(matchesService.sendMessage).toHaveBeenCalledWith(
        'match-1',
        'user-1',
        'hello',
      );
      expect(mockServer.to).toHaveBeenCalledWith('match:match-1');
      expect(mockServer.emit).toHaveBeenCalledWith('message:new', {
        matchId: 'match-1',
        message: savedMessage,
      });
    });

    it('emits error when sendMessage fails', async () => {
      const socket = createMockSocket();
      socket.data = { userId: 'user-1', email: 'user@test.com' };
      matchesService.sendMessage.mockRejectedValueOnce(new Error('Access denied'));

      await gateway.handleSendMessage(socket, {
        matchId: 'match-1',
        content: 'hello',
      });

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Access denied',
      });
    });

    it('rejects send when client is not authenticated', async () => {
      const socket = createMockSocket();
      socket.data = {};

      await gateway.handleSendMessage(socket, {
        matchId: 'match-1',
        content: 'hello',
      });

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Not authenticated',
      });
      expect(matchesService.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('emitMessageToRoom', () => {
    it('broadcasts message to the match room', () => {
      const message = {
        id: 'msg-1',
        text: 'hello',
        sender: 'me' as const,
        timestamp: new Date(),
      };

      gateway.emitMessageToRoom('match-1', message);

      expect(mockServer.to).toHaveBeenCalledWith('match:match-1');
      expect(mockServer.emit).toHaveBeenCalledWith('message:new', {
        matchId: 'match-1',
        message,
      });
    });
  });
});
