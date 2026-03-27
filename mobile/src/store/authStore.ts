import { create } from "zustand";
import * as Sentry from "@sentry/react-native";
import { authApi } from "../services/api";
import { normalizeApiError } from "../api/errors";
import { getToken, setToken, deleteToken } from "../api/tokenStorage";
import { queryClient } from "../lib/query/queryClient";
import { queryKeys } from "../lib/query/queryKeys";
import { deregisterPushToken } from "../services/pushRegistration";
import type { User } from "../api/types";

interface LoginPayload {
  email: string;
  password: string;
}

interface SignupPayload {
  email: string;
  password: string;
  firstName: string;
  birthdate: string;
  gender: string;
}

function toSessionUser(user: User | null): User | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    gender: user.gender,
    isOnboarded: user.isOnboarded,
    showMeMen: user.showMeMen,
    showMeWomen: user.showMeWomen,
    profile: user.profile
      ? {
          intentDating: user.profile.intentDating,
          intentWorkout: user.profile.intentWorkout,
          intentFriends: user.profile.intentFriends,
        }
      : undefined,
  };
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  clearSession: () => void;
  login: (data: LoginPayload) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithApple: (identityToken: string, fullName?: string) => Promise<void>;
  signup: (data: SignupPayload) => Promise<void>;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  setSession: (token: string, user: User) => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,

  clearSession: () => set({ token: null, user: null, isLoading: false }),

  setSession: (token, user) => {
    queryClient.setQueryData(queryKeys.profile.current(), user);
    set({ token, user: toSessionUser(user), isLoading: false });
  },

  setUser: (user) => set({ user: toSessionUser(user) }),

  login: async (data) => {
    try {
      const response = await authApi.login(data) as { data: { access_token: string; user: User } };
      const { access_token, user } = response.data;
      await setToken(access_token);
      get().setSession(access_token, user);
      Sentry.setUser({ id: user.id, email: user.email ?? undefined });
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  loginWithGoogle: async (idToken) => {
    try {
      const response = await authApi.googleLogin(idToken) as { data: { access_token: string; user: User } };
      const { access_token, user } = response.data;
      await setToken(access_token);
      get().setSession(access_token, user);
      Sentry.setUser({ id: user.id, email: user.email ?? undefined });
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  loginWithApple: async (identityToken, fullName) => {
    try {
      const response = await authApi.appleLogin(identityToken, fullName) as { data: { access_token: string; user: User } };
      const { access_token, user } = response.data;
      await setToken(access_token);
      get().setSession(access_token, user);
      Sentry.setUser({ id: user.id, email: user.email ?? undefined });
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  signup: async (data) => {
    try {
      const response = await authApi.signup(data) as { data: { access_token: string; user: User } };
      const { access_token, user } = response.data;
      await setToken(access_token);
      get().setSession(access_token, user);
      Sentry.setUser({ id: user.id, email: user.email ?? undefined });
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  logout: async () => {
    // Best-effort cleanup: do not block logout on a network round-trip.
    void deregisterPushToken();
    queryClient.clear();
    await deleteToken();
    Sentry.setUser(null);
    get().clearSession();
  },

  deleteAccount: async () => {
    try {
      await authApi.deleteAccount();
    } catch (error) {
      throw normalizeApiError(error);
    }

    try {
      void deregisterPushToken();
      queryClient.clear();
      await deleteToken();
    } finally {
      Sentry.setUser(null);
      get().clearSession();
    }
  },

  loadToken: async () => {
    set({ isLoading: true });
    const token = await getToken();
    if (!token) {
      set({ token: null, user: null, isLoading: false });
      return;
    }

    try {
      const response = await authApi.me(token) as { data: User };
      get().setSession(token, response.data);
    } catch (err: unknown) {
      const normalized = normalizeApiError(err);
      if (normalized.isUnauthorized || normalized.status === 403) {
        // Token is genuinely invalid — clear it
        await deleteToken();
        set({ token: null, user: null, isLoading: false });
      } else {
        // Network or transient error — keep the token so the app can retry
        set({ token, user: null, isLoading: false });
      }
    }
  },
}));
