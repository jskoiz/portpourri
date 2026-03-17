import { Injectable } from '@nestjs/common';
import { Observable, Subject, finalize } from 'rxjs';

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
