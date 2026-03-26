export const queryKeys = {
  discovery: {
    all: () => ['discovery'] as const,
    feeds: () => ['discovery', 'feed'] as const,
    feed: (filters?: Record<string, unknown>) =>
      ['discovery', 'feed', filters ?? {}] as const,
    profileCompleteness: () => ['discovery', 'profileCompleteness'] as const,
  },
  profile: {
    all: () => ['profile'] as const,
    current: () => ['profile', 'current'] as const,
    public: (userId: string) => ['profile', 'public', userId] as const,
  },
  matches: {
    all: () => ['matches'] as const,
    list: () => ['matches', 'list'] as const,
    messages: (matchId: string) => ['matches', 'messages', matchId] as const,
  },
  notifications: {
    all: () => ['notifications'] as const,
    list: () => ['notifications', 'list'] as const,
  },
  events: {
    all: () => ['events'] as const,
    list: () => ['events', 'list'] as const,
    detail: (eventId: string) => ['events', 'detail', eventId] as const,
    mine: () => ['events', 'mine'] as const,
  },
};
