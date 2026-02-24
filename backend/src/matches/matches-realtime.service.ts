import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

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

  stream(matchId: string): Observable<MatchMessageEvent> {
    return this.getOrCreateStream(matchId).asObservable();
  }

  publishMessage(matchId: string, message: MatchMessagePayload) {
    this.getOrCreateStream(matchId).next({
      type: 'message',
      matchId,
      message,
    });
  }

  private getOrCreateStream(matchId: string): Subject<MatchMessageEvent> {
    const existing = this.streams.get(matchId);
    if (existing) return existing;

    const subject = new Subject<MatchMessageEvent>();
    this.streams.set(matchId, subject);
    return subject;
  }
}
