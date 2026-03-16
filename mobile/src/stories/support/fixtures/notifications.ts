import type { AppNotification } from '../../../api/types';

export function makeNotification(
  overrides: Partial<AppNotification> = {},
): AppNotification {
  return {
    id: overrides.id ?? 'notification-1',
    userId: overrides.userId ?? 'user-1',
    type: overrides.type ?? 'event_reminder',
    title: overrides.title ?? 'Event reminder',
    body:
      overrides.body ??
      'Makapuu sunrise hike starts tomorrow at 6:00 AM.',
    data: overrides.data ?? { eventId: 'event-1' },
    read: overrides.read ?? false,
    readAt: overrides.readAt ?? null,
    createdAt: overrides.createdAt ?? '2026-03-15T18:00:00.000Z',
  };
}
