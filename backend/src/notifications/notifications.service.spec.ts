import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(() => {
    service = new NotificationsService();
  });

  it('creates a notification and returns it', () => {
    const n = service.create('user-1', {
      type: 'system',
      title: 'Hello',
      body: 'World',
    });

    expect(n).toMatchObject({
      userId: 'user-1',
      type: 'system',
      title: 'Hello',
      body: 'World',
      readAt: null,
    });
    expect(n.id).toBeTruthy();
    expect(n.createdAt).toBeInstanceOf(Date);
  });

  it('lists notifications newest-first', () => {
    service.create('user-1', { type: 'system', title: 'A', body: '' });
    service.create('user-1', { type: 'system', title: 'B', body: '' });

    const list = service.list('user-1');
    expect(list[0].title).toBe('B');
    expect(list[1].title).toBe('A');
  });

  it('returns empty list for unknown user', () => {
    expect(service.list('nobody')).toEqual([]);
  });

  it('marks a single notification as read', () => {
    const n = service.create('user-1', {
      type: 'match_created',
      title: 'Match!',
      body: '',
    });

    const updated = service.markRead('user-1', n.id);
    expect(updated?.readAt).toBeInstanceOf(Date);
  });

  it('returns null when marking unknown notification as read', () => {
    service.create('user-1', { type: 'system', title: 'X', body: '' });
    expect(service.markRead('user-1', 'non-existent-id')).toBeNull();
  });

  it('marks all unread notifications as read', () => {
    service.create('user-1', { type: 'system', title: 'A', body: '' });
    service.create('user-1', { type: 'system', title: 'B', body: '' });

    const { updated } = service.markAllRead('user-1');
    expect(updated).toBe(2);

    const list = service.list('user-1');
    expect(list.every((n) => n.readAt !== null)).toBe(true);
  });

  it('isolates notifications per user', () => {
    service.create('user-1', { type: 'system', title: 'U1', body: '' });
    service.create('user-2', { type: 'system', title: 'U2', body: '' });

    expect(service.list('user-1')).toHaveLength(1);
    expect(service.list('user-2')).toHaveLength(1);
    expect(service.list('user-1')[0].title).toBe('U1');
  });

  it('caps stored notifications at 200', () => {
    for (let i = 0; i < 205; i++) {
      service.create('user-cap', {
        type: 'system',
        title: `n${i}`,
        body: '',
      });
    }
    expect(service.list('user-cap')).toHaveLength(200);
  });
});
