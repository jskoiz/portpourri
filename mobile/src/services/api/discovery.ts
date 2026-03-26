import client from '../../api/client';
import type {
  DiscoveryUser,
  LikeResponse,
  PassResponse,
  ProfileCompletenessResponse,
  UndoSwipeResponse,
} from '../../api/types';
import { withErrorLogging } from './shared';

export type DiscoveryFiltersInput = {
  distanceKm?: number;
  minAge?: number;
  maxAge?: number;
  goals?: string[];
  intensity?: string[];
  availability?: ('morning' | 'evening')[];
};

export const discoveryApi = {
  feed: async (filters?: DiscoveryFiltersInput) =>
    withErrorLogging('discovery', 'feed', () =>
      client.get<DiscoveryUser[]>('/discovery/feed', {
        params: {
          distanceKm: filters?.distanceKm,
          minAge: filters?.minAge,
          maxAge: filters?.maxAge,
          goals: filters?.goals?.join(','),
          intensity: filters?.intensity?.join(','),
          availability: filters?.availability?.join(','),
        },
      }),
    ),
  pass: async (userId: string) =>
    withErrorLogging('discovery', 'pass', () =>
      client.post<PassResponse>(`/discovery/pass/${userId}`),
      { targetUserId: userId },
    ),
  like: async (userId: string) =>
    withErrorLogging('discovery', 'like', () =>
      client.post<LikeResponse>(`/discovery/like/${userId}`),
      { targetUserId: userId },
    ),
  undo: async () =>
    withErrorLogging('discovery', 'undo', () =>
      client.post<UndoSwipeResponse>('/discovery/undo'),
    ),
  profileCompleteness: async () =>
    withErrorLogging('discovery', 'profileCompleteness', () =>
      client.get<ProfileCompletenessResponse>('/discovery/profile-completeness'),
    ),
};
