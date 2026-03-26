import { createTestQueryClient } from '../../testing/queryTestHarness';
import { QueryObserver } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react-native';
import {
  invalidateProfileSurfaces,
  invalidateQueryScopes,
  queryInvalidationScopes,
} from '../queryInvalidation';
import { queryKeys } from '../queryKeys';

function isInvalidated(
  queryClient: ReturnType<typeof createTestQueryClient>,
  queryKey: readonly unknown[],
) {
  return queryClient.getQueryState(queryKey as never)?.isInvalidated ?? false;
}

describe('query invalidation helpers', () => {
  it('invalidates every discovery feed variant and the matches list', async () => {
    const queryClient = createTestQueryClient();
    const defaultFeedKey = queryKeys.discovery.feed();
    const filteredFeedKey = queryKeys.discovery.feed({ distanceKm: 10 });
    const completenessKey = queryKeys.discovery.profileCompleteness();

    queryClient.setQueryData(defaultFeedKey, []);
    queryClient.setQueryData(filteredFeedKey, []);
    queryClient.setQueryData(completenessKey, {
      score: 3,
      total: 5,
      earned: 3,
      prompts: [],
      missing: [],
    });
    queryClient.setQueryData(queryKeys.matches.list(), []);

    await invalidateQueryScopes(queryClient, queryInvalidationScopes.discoveryAction);

    expect(isInvalidated(queryClient, defaultFeedKey)).toBe(true);
    expect(isInvalidated(queryClient, filteredFeedKey)).toBe(true);
    expect(isInvalidated(queryClient, queryKeys.matches.list())).toBe(true);
    expect(isInvalidated(queryClient, completenessKey)).toBe(false);
  });

  it('invalidates profile, discovery, and matches caches together', async () => {
    const queryClient = createTestQueryClient();
    const defaultFeedKey = queryKeys.discovery.feed();
    const filteredFeedKey = queryKeys.discovery.feed({ distanceKm: 10 });
    const completenessKey = queryKeys.discovery.profileCompleteness();
    const profileKey = queryKeys.profile.current();

    queryClient.setQueryData(profileKey, { id: 'u1' });
    queryClient.setQueryData(defaultFeedKey, []);
    queryClient.setQueryData(filteredFeedKey, []);
    queryClient.setQueryData(completenessKey, {
      score: 1,
      total: 5,
      earned: 1,
      prompts: [],
      missing: [],
    });
    queryClient.setQueryData(queryKeys.matches.list(), []);

    await invalidateProfileSurfaces(queryClient);

    expect(isInvalidated(queryClient, profileKey)).toBe(true);
    expect(isInvalidated(queryClient, completenessKey)).toBe(true);
    expect(isInvalidated(queryClient, defaultFeedKey)).toBe(true);
    expect(isInvalidated(queryClient, filteredFeedKey)).toBe(true);
    expect(isInvalidated(queryClient, queryKeys.matches.list())).toBe(true);
  });

  it('invalidates all event caches with one family key and keeps the refetch type narrow', async () => {
    const queryClient = createTestQueryClient();
    const listKey = queryKeys.events.list();
    const mineKey = queryKeys.events.mine();
    const detailKey = queryKeys.events.detail('event-1');

    queryClient.setQueryData(listKey, []);
    queryClient.setQueryData(mineKey, []);
    queryClient.setQueryData(detailKey, { id: 'event-1' });

    await invalidateQueryScopes(queryClient, queryInvalidationScopes.eventWrite);

    expect(isInvalidated(queryClient, listKey)).toBe(true);
    expect(isInvalidated(queryClient, mineKey)).toBe(true);
    expect(isInvalidated(queryClient, detailKey)).toBe(true);
  });

  it('marks all event caches as invalidated using the eventWrite scope with inactive refetch', async () => {
    const queryClient = createTestQueryClient();
    const listKey = queryKeys.events.list();
    const mineKey = queryKeys.events.mine();
    const detailKey = queryKeys.events.detail('event-1');

    queryClient.setQueryData(listKey, []);
    queryClient.setQueryData(mineKey, []);
    queryClient.setQueryData(detailKey, { id: 'event-1' });

    await invalidateQueryScopes(queryClient, queryInvalidationScopes.eventWrite);

    expect(isInvalidated(queryClient, listKey)).toBe(true);
    expect(isInvalidated(queryClient, mineKey)).toBe(true);
    expect(isInvalidated(queryClient, detailKey)).toBe(true);
  });
});
