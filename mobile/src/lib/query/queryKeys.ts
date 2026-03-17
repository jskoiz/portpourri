export const queryKeys = {
  discovery: {
    feed: (filters?: Record<string, unknown>) =>
      ['discovery', 'feed', filters ?? {}] as const,
    profileCompleteness: ['discovery', 'profileCompleteness'] as const,
  },
  profile: {
    current: ['profile', 'current'] as const,
  },
  matches: {
    list: ['matches', 'list'] as const,
    messages: (matchId: string) => ['matches', 'messages', matchId] as const,
  },
  notifications: {
    list: ['notifications', 'list'] as const,
  },
  events: {
    list: ['events', 'list'] as const,
    detail: (eventId: string) => ['events', 'detail', eventId] as const,
    mine: ['events', 'mine'] as const,
  },
};
