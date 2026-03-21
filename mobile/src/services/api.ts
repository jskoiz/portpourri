import client from "../api/client";
import type {
  AppNotification,
  AuthenticatedUser,
  AuthResponse,
  BlockPayload,
  BlockResponse,
  ChatMessage,
  CreateEventPayload,
  DiscoveryUser,
  EventDetail,
  EventInviteListItem,
  EventInviteResponse,
  EventRsvpResponse,
  EventSummary,
  LikeResponse,
  Match,
  ProfileCompletenessResponse,
  ReportPayload,
  ReportResponse,
  UpdateFitnessPayload,
  UpdatePhotoPayload,
  UpdateProfilePayload,
  UndoSwipeResponse,
  UploadPhotoPayload,
  User,
  UserProfile,
  UserPhoto,
} from "../api/types";
import { logApiFailure } from "../api/observability";
import { normalizeIntensityLevelForApi } from "../api/profileIntensity";

type ApiDomain = Parameters<typeof logApiFailure>[0];
type ReactNativeFormDataFile = {
  uri: string;
  name?: string;
  type?: string;
};
type ReactNativeFormData = FormData & {
  append(name: string, value: ReactNativeFormDataFile): void;
};
type UserProfileRecord = UserProfile & { userId: string };

async function withErrorLogging<T>(
  domain: ApiDomain,
  action: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logApiFailure(domain, action, error, context);
    throw error;
  }
}

export const authApi = {
  login: async (payload: { email: string; password: string }) =>
    withErrorLogging("auth", "login", () =>
      client.post<AuthResponse>("/auth/login", payload),
      { email: payload.email },
    ),
  signup: async (payload: {
    email: string;
    password: string;
    firstName: string;
    birthdate: string;
    gender: string;
  }) =>
    withErrorLogging("auth", "signup", () =>
      client.post<AuthResponse>("/auth/signup", payload),
      { email: payload.email },
    ),
  me: async (token: string) =>
    withErrorLogging("auth", "me", () =>
      client.get<AuthenticatedUser>("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ),
  deleteAccount: async () =>
    withErrorLogging("auth", "deleteAccount", () =>
      client.delete<void>("/auth/me"),
    ),
};

export const profileApi = {
  getProfile: async () =>
    withErrorLogging("profile", "getProfile", () =>
      client.get<User>("/profile"),
    ),
  updateFitness: async (payload: UpdateFitnessPayload) =>
    withErrorLogging("profile", "updateFitness", () =>
      client.patch<User>("/profile/fitness", {
        ...payload,
        intensityLevel: normalizeIntensityLevelForApi(payload.intensityLevel),
      }),
    ),
  updateProfile: async (payload: UpdateProfilePayload) =>
    withErrorLogging("profile", "updateProfile", () =>
      client.patch<UserProfileRecord>("/profile", payload),
    ),
  uploadPhoto: async (payload: UploadPhotoPayload) => {
    const formData = new FormData() as ReactNativeFormData;
    const file: ReactNativeFormDataFile = {
      uri: payload.uri,
      name: payload.fileName ?? `profile-${Date.now()}.jpg`,
      type: payload.mimeType ?? 'image/jpeg',
    };
    formData.append('file', file);

    return withErrorLogging("profile", "uploadPhoto", () =>
      client.post<UserPhoto>('/profile/photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event) => {
          if (!payload.onProgress || !event.total) return;
          payload.onProgress(Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100))));
        },
      }),
    );
  },
  updatePhoto: async (photoId: string, payload: UpdatePhotoPayload) =>
    withErrorLogging("profile", "updatePhoto", () =>
      client.patch<UserPhoto | null>(`/profile/photos/${photoId}`, payload),
      { photoId },
    ),
  deletePhoto: async (photoId: string) =>
    withErrorLogging("profile", "deletePhoto", () =>
      client.delete<UserPhoto | null>(`/profile/photos/${photoId}`),
      { photoId },
    ),
};

export type DiscoveryFiltersInput = {
  distanceKm?: number;
  minAge?: number;
  maxAge?: number;
  goals?: string[];
  intensity?: string[];
  availability?: ("morning" | "evening")[];
};

export const discoveryApi = {
  feed: async (filters?: DiscoveryFiltersInput) =>
    withErrorLogging("discovery", "feed", () =>
      client.get<DiscoveryUser[]>("/discovery/feed", {
        params: {
          distanceKm: filters?.distanceKm,
          minAge: filters?.minAge,
          maxAge: filters?.maxAge,
          goals: filters?.goals?.join(","),
          intensity: filters?.intensity?.join(","),
          availability: filters?.availability?.join(","),
        },
      }),
    ),
  pass: async (userId: string) =>
    withErrorLogging("discovery", "pass", () =>
      client.post<void>(`/discovery/pass/${userId}`),
      { targetUserId: userId },
    ),
  like: async (userId: string) =>
    withErrorLogging("discovery", "like", () =>
      client.post<LikeResponse>(`/discovery/like/${userId}`),
      { targetUserId: userId },
    ),
  undo: async () =>
    withErrorLogging("discovery", "undo", () =>
      client.post<UndoSwipeResponse>("/discovery/undo"),
    ),
  profileCompleteness: async () =>
    withErrorLogging("discovery", "profileCompleteness", () =>
      client.get<ProfileCompletenessResponse>("/discovery/profile-completeness"),
    ),
};

export const matchesApi = {
  list: async () =>
    withErrorLogging("matches", "list", () =>
      client.get<Match[]>("/matches"),
    ),
  getMessages: async (matchId: string) =>
    withErrorLogging("matches", "getMessages", () =>
      client.get<ChatMessage[]>(`/matches/${matchId}/messages`),
      { matchId },
    ),
  sendMessage: async (matchId: string, content: string) =>
    withErrorLogging("matches", "sendMessage", () =>
      client.post<ChatMessage>(`/matches/${matchId}/messages`, { content }),
      { matchId },
    ),
};

export const notificationsApi = {
  list: async () =>
    withErrorLogging("notifications", "list", () =>
      client.get<AppNotification[]>("/notifications"),
    ),
  markRead: async (id: string) =>
    withErrorLogging("notifications", "markRead", () =>
      client.patch<AppNotification | null>(`/notifications/${id}/read`),
      { id },
    ),
  markAllRead: async () =>
    withErrorLogging("notifications", "markAllRead", () =>
      client.post<{ updated: number }>("/notifications/mark-all-read"),
    ),
};

export const moderationApi = {
  report: async (payload: ReportPayload) =>
    withErrorLogging("moderation", "report", () =>
      client.post<ReportResponse>("/moderation/report", payload),
      { reportedUserId: payload.reportedUserId, category: payload.category },
    ),
  block: async (payload: BlockPayload) =>
    withErrorLogging("moderation", "block", () =>
      client.post<BlockResponse>("/moderation/block", payload),
      { blockedUserId: payload.blockedUserId },
    ),
};

export const eventsApi = {
  list: async () =>
    withErrorLogging("events", "list", () =>
      client.get<EventSummary[]>("/events"),
    ),
  create: async (payload: CreateEventPayload) =>
    withErrorLogging("events", "create", () =>
      client.post<EventSummary>("/events", payload),
      { title: payload.title, category: payload.category },
    ),
  detail: async (id: string) =>
    withErrorLogging("events", "detail", () =>
      client.get<EventDetail>(`/events/${id}`),
      { id },
    ),
  rsvp: async (id: string) =>
    withErrorLogging("events", "rsvp", () =>
      client.post<EventRsvpResponse>(`/events/${id}/rsvp`),
      { id },
    ),
  mine: async () =>
    withErrorLogging("events", "mine", () =>
      client.get<EventSummary[]>("/events/me"),
    ),
  invite: async (eventId: string, matchId: string, message?: string) =>
    withErrorLogging("events", "invite", () =>
      client.post<EventInviteResponse>(`/events/${eventId}/invite`, {
        matchId,
        ...(message ? { message } : {}),
      }),
      { eventId, matchId },
    ),
  getInvites: async (eventId: string) =>
    withErrorLogging("events", "getInvites", () =>
      client.get<EventInviteListItem[]>(`/events/${eventId}/invites`),
      { eventId },
    ),
};
