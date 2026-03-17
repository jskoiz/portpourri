import { Logger, UnauthorizedException } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { appConfig } from '../config/app.config';
import { MatchesService } from './matches.service';

interface JwtPayload {
  sub: string;
  email: string;
}

interface AuthenticatedSocket extends Socket {
  data: { userId: string; email: string };
}

@WebSocketGateway({ namespace: '/chat', cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly matchesService: MatchesService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        (client.handshake.auth as { token?: string })?.token ||
        client.handshake.query?.token as string ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new UnauthorizedException('Missing authentication token');
      }

      const payload = jwt.verify(token, appConfig.jwt.secret) as JwtPayload;
      client.data = { userId: payload.sub, email: payload.email };
      this.logger.debug(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      this.logger.warn(`Connection rejected: ${client.id}`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:match')
  async handleJoinMatch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ) {
    const userId = client.data?.userId;
    if (!userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      // Validates that the user is part of this match
      await this.matchesService.getMessages(data.matchId, userId, 1);
      await client.join(`match:${data.matchId}`);
      client.emit('joined:match', { matchId: data.matchId });
      this.logger.debug(`User ${userId} joined match room ${data.matchId}`);
    } catch {
      client.emit('error', { message: 'Cannot join this match room' });
    }
  }

  @SubscribeMessage('leave:match')
  async handleLeaveMatch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ) {
    await client.leave(`match:${data.matchId}`);
    client.emit('left:match', { matchId: data.matchId });
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string; content: string },
  ) {
    const userId = client.data?.userId;
    if (!userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const message = await this.matchesService.sendMessage(
        data.matchId,
        userId,
        data.content,
      );

      // Broadcast to all clients in the room (including sender)
      this.server.to(`match:${data.matchId}`).emit('message:new', {
        matchId: data.matchId,
        message,
      });
    } catch (error) {
      client.emit('error', {
        message:
          error instanceof Error ? error.message : 'Failed to send message',
      });
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ) {
    const userId = client.data?.userId;
    if (!userId) return;

    client.to(`match:${data.matchId}`).emit('typing:start', {
      matchId: data.matchId,
      userId,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ) {
    const userId = client.data?.userId;
    if (!userId) return;

    client.to(`match:${data.matchId}`).emit('typing:stop', {
      matchId: data.matchId,
      userId,
    });
  }

  /**
   * Emit a new message to all clients in a match room.
   * Called by MatchesRealtimeService to bridge SSE and WS transports.
   */
  emitMessageToRoom(
    matchId: string,
    message: { id: string; text: string; sender: 'me' | 'them'; timestamp: Date },
  ) {
    this.server?.to(`match:${matchId}`).emit('message:new', {
      matchId,
      message,
    });
  }
}
