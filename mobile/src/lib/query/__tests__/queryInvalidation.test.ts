import { createTestQueryClient } from '../../testing/queryTestHarness';
import {
  invalidateDiscoverySurfaces,
  invalidateEventSurfaces,
  invalidateProfileSurfaces,
} from '../queryInvalidation';
import { queryKeys } from '../queryKeys';

function isInvalidated(queryClient: ReturnType<typeof createTestQueryClient>, queryKey: readonly unknown[]) {
  return queryClient.getQueryState(queryKey as never)?.isInvalidated ?? false;
}

describe('query invalidation helpers', () => {
  it('invalidates every discovery feed variant and the matches list', async () => {
    const queryClient = createTestQueryClient();
    const defaultFeedKey = queryKeys.discovery.feed();
    const filteredFeedKey = queryKeys.discovery.feed({ distanceKm: 10 });

    queryClient.setQueryData(defaultFeedKey, []);
    queryClient.setQueryData(filteredFeedKey, []);
    queryClient.setQueryData(queryKeys.matches.list, []);

    await invalidateDiscoverySurfaces(queryClient);

    expect(isInvalidated(queryClient, defaultFeedKey)).toBe(true);
    expect(isInvalidated(queryClient, filteredFeedKey)).toBe(true);
    expect(isInvalidated(queryClient, queryKeys.matches.list)).toBe(true);
  });

  it('invalidates profile, discovery, and matches caches together', async () => {
    const queryClient = createTestQueryClient();
    const defaultFeedKey = queryKeys.discovery.feed();
    const profileKey = queryKeys.profile.current;

    queryClient.setQueryData(profileKey, { id: 'u1' });
    queryClient.setQueryData(defaultFeedKey, []);
    queryClient.setQueryData(queryKeys.matches.list, []);

    await invalidateProfileSurfaces(queryClient);

    expect(isInvalidated(queryClient, profileKey)).toBe(true);
    expect(isInvalidated(queryClient, defaultFeedKey)).toBe(true);
    expect(isInvalidated(queryClient, queryKeys.matches.list)).toBe(true);
  });

  it('invalidates all event caches with one family key', async () => {
    const queryClient = createTestQueryClient();
    const listKey = queryKeys.events.list;
    const mineKey = queryKeys.events.mine;
    const detailKey = queryKeys.events.detail('event-1');

    queryClient.setQueryData(listKey, []);
    queryClient.setQueryData(mineKey, []);
    queryClient.setQueryData(detailKey, { id: 'event-1' });

    await invalidateEventSurfaces(queryClient);

    expect(isInvalidated(queryClient, listKey)).toBe(true);
    expect(isInvalidated(queryClient, mineKey)).toBe(true);
    expect(isInvalidated(queryClient, detailKey)).toBe(true);
  });
});
