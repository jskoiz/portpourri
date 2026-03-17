import { Inject, Injectable, Optional, forwardRef } from '@nestjs/common';
import { Observable, Subject, finalize } from 'rxjs';
import type { ChatGateway } from './chat.gateway';

export interface MatchMessagePayload {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: Date;
}

export interface MatchMessageEvent {
  type: 'message';
  matchId: string;
  message: MatchMessagePayload;
}

@Injectable()
export class MatchesRealtimeService {
  private readonly streams = new Map<string, Subject<MatchMessageEvent>>();
  private readonly refCounts = new Map<string, number>();
  private chatGateway: ChatGateway | null = null;

  /**
   * Inject the ChatGateway lazily to avoid circular dependency.
   * Both ChatGateway and MatchesService depend on each other indirectly
   * through this service, so we use forwardRef + optional injection.
   */
  @Optional()
  @Inject(forwardRef(() => 'ChatGateway'))
  set _chatGateway(gateway: ChatGateway | null) {
    this.chatGateway = gateway ?? null;
  }

  /** Number of active streams (exposed for testing). */
  get activeStreamCount(): number {
    return this.streams.size;
  }

  stream(matchId: string): Observable<MatchMessageEvent> {
    this.incrementRef(matchId);
    return this.getOrCreateStream(matchId).asObservable().pipe(
      finalize(() => this.decrementRef(matchId)),
    );
  }

  publishMessage(matchId: string, message: MatchMessagePayload) {
    // Publish to SSE subscribers via RxJS Subject
    this.getOrCreateStream(matchId).next({
      type: 'message',
      matchId,
      message,
    });

    // Also publish to WebSocket room via the gateway
    this.chatGateway?.emitMessageToRoom(matchId, message);
  }

  private getOrCreateStream(matchId: string): Subject<MatchMessageEvent> {
    const existing = this.streams.get(matchId);
    if (existing) return existing;

    const subject = new Subject<MatchMessageEvent>();
    this.streams.set(matchId, subject);
    return subject;
  }

  private incrementRef(matchId: string): void {
    this.refCounts.set(matchId, (this.refCounts.get(matchId) ?? 0) + 1);
  }

  private decrementRef(matchId: string): void {
    const count = (this.refCounts.get(matchId) ?? 1) - 1;
    if (count <= 0) {
      this.removeStream(matchId);
    } else {
      this.refCounts.set(matchId, count);
    }
  }

  private removeStream(matchId: string): void {
    const subject = this.streams.get(matchId);
    if (subject) {
      subject.complete();
      this.streams.delete(matchId);
    }
    this.refCounts.delete(matchId);
  }
}
