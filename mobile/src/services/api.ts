import client from "../api/client";
import type {
  AuthResponse,
  EventDetail,
  EventRsvpResponse,
  EventSummary,
  LikeResponse,
  ProfileCompletenessResponse,
  UndoSwipeResponse,
} from "../api/types";
import { logApiFailure } from "../api/observability";

export const authApi = {
  login: async (payload: { email: string; password: string }) => {
    try {
      return await client.post<AuthResponse>("/auth/login", payload);
    } catch (error) {
      logApiFailure("auth", "login", error, { email: payload.email });
      throw error;
    }
  },
  signup: async (payload: {
    email: string;
    password: string;
    firstName: string;
    birthdate: string;
    gender: string;
  }) => {
    try {
      return await client.post<AuthResponse>("/auth/signup", payload);
    } catch (error) {
      logApiFailure("auth", "signup", error, { email: payload.email });
      throw error;
    }
  },
  me: async (token: string) => {
    try {
      return await client.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      logApiFailure("auth", "me", error);
      throw error;
    }
  },
};

export const profileApi = {
  getProfile: async () => {
    try {
      return await client.get("/profile");
    } catch (error) {
      logApiFailure("profile", "getProfile", error);
      throw error;
    }
  },
  updateFitness: async (payload: {
    intensityLevel: string;
    weeklyFrequencyBand: string;
    primaryGoal: string;
    favoriteActivities: string;
  }) => {
    try {
      return await client.put("/profile/fitness", payload);
    } catch (error) {
      logApiFailure("profile", "updateFitness", error);
      throw error;
    }
  },
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
  feed: async (filters?: DiscoveryFiltersInput) => {
    try {
      return await client.get("/discovery/feed", {
        params: {
          distanceKm: filters?.distanceKm,
          minAge: filters?.minAge,
          maxAge: filters?.maxAge,
          goals: filters?.goals?.join(","),
          intensity: filters?.intensity?.join(","),
          availability: filters?.availability?.join(","),
        },
      });
    } catch (error) {
      logApiFailure("discovery", "feed", error);
      throw error;
    }
  },
  pass: async (userId: string) => {
    try {
      return await client.post(`/discovery/pass/${userId}`);
    } catch (error) {
      logApiFailure("discovery", "pass", error, { targetUserId: userId });
      throw error;
    }
  },
  like: async (userId: string) => {
    try {
      return await client.post<LikeResponse>(`/discovery/like/${userId}`);
    } catch (error) {
      logApiFailure("discovery", "like", error, { targetUserId: userId });
      throw error;
    }
  },
  undo: async () => {
    try {
      return await client.post<UndoSwipeResponse>("/discovery/undo");
    } catch (error) {
      logApiFailure("discovery", "undo", error);
      throw error;
    }
  },
  profileCompleteness: async () => {
    try {
      return await client.get<ProfileCompletenessResponse>(
        "/discovery/profile-completeness",
      );
    } catch (error) {
      logApiFailure("discovery", "profileCompleteness", error);
      throw error;
    }
  },
};

export const matchesApi = {
  list: () => client.get("/matches"),
  getMessages: (matchId: string) => client.get(`/matches/${matchId}/messages`),
  sendMessage: (matchId: string, content: string) =>
    client.post(`/matches/${matchId}/messages`, { content }),
};

export const notificationsApi = {
  list: () => client.get("/notifications"),
  markRead: (id: string) => client.patch(`/notifications/${id}/read`),
  markAllRead: () => client.post("/notifications/mark-all-read"),
};

export const eventsApi = {
  list: async () => {
    try {
      return await client.get<EventSummary[]>("/events");
    } catch (error) {
      logApiFailure("events", "list", error);
      throw error;
    }
  },
  detail: async (id: string) => {
    try {
      return await client.get<EventDetail>(`/events/${id}`);
    } catch (error) {
      logApiFailure("events", "detail", error, { id });
      throw error;
    }
  },
  rsvp: async (id: string) => {
    try {
      return await client.post<EventRsvpResponse>(`/events/${id}/rsvp`);
    } catch (error) {
      logApiFailure("events", "rsvp", error, { id });
      throw error;
    }
  },
  mine: async () => {
    try {
      return await client.get<EventSummary[]>("/events/me");
    } catch (error) {
      logApiFailure("events", "mine", error);
      throw error;
    }
  },
};
