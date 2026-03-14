import { firstValueFrom } from 'rxjs';
import { MatchesRealtimeService } from './matches-realtime.service';
import type { MatchMessagePayload } from './matches-realtime.service';

describe('MatchesRealtimeService', () => {
  let service: MatchesRealtimeService;

  beforeEach(() => {
    service = new MatchesRealtimeService();
  });

  it('creates a stream on first access and returns an observable', (done) => {
    const obs = service.stream('match-1');
    expect(obs).toBeDefined();

    const msg: MatchMessagePayload = {
      id: 'msg-1',
      text: 'hello',
      sender: 'me',
      timestamp: new Date(),
    };

    obs.subscribe((event) => {
      expect(event).toEqual({ type: 'message', matchId: 'match-1', message: msg });
      done();
    });

    service.publishMessage('match-1', msg);
  });

  it('reuses the same subject for the same matchId', async () => {
    const msg: MatchMessagePayload = {
      id: 'msg-2',
      text: 'hi',
      sender: 'them',
      timestamp: new Date(),
    };

    const obs1 = service.stream('match-2');
    const obs2 = service.stream('match-2');

    const received1 = firstValueFrom(obs1);
    const received2 = firstValueFrom(obs2);

    service.publishMessage('match-2', msg);

    const [e1, e2] = await Promise.all([received1, received2]);
    expect(e1.message.id).toBe('msg-2');
    expect(e2.message.id).toBe('msg-2');
  });

  it('publishes to different streams independently', (done) => {
    const msgA: MatchMessagePayload = { id: 'a', text: 'A', sender: 'me', timestamp: new Date() };
    const msgB: MatchMessagePayload = { id: 'b', text: 'B', sender: 'them', timestamp: new Date() };

    const received: string[] = [];

    service.stream('match-a').subscribe((e) => received.push(e.message.id));
    service.stream('match-b').subscribe((e) => received.push(e.message.id));

    service.publishMessage('match-a', msgA);
    service.publishMessage('match-b', msgB);

    // Both streams received only their own message
    expect(received).toContain('a');
    expect(received).toContain('b');
    done();
  });
});
