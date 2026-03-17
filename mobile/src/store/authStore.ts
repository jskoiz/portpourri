import { create } from "zustand";
import * as Sentry from "@sentry/react-native";
import { authApi } from "../services/api";
import { normalizeApiError } from "../api/errors";
import { getToken, setToken, deleteToken } from "../lib/secureStorage";
import { queryClient } from "../lib/query/queryClient";
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

// NOTE: `user` is duplicated here and in the React Query profile cache
// (via useProfile). Several screens (HomeScreen, OnboardingScreen, ExploreScreen,
// MyEventsScreen) read `authStore.user` for lightweight data like `id` and
// `firstName`. Ideally screens would read exclusively from useProfile and this
// store would only hold `token` + auth status, but that migration touches many
// screens. Until then, profile mutation hooks sync back into this store via
// `setUser` in their onSuccess callbacks to keep the two sources consistent.
interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  clearSession: () => void;
  login: (data: LoginPayload) => Promise<void>;
  signup: (data: SignupPayload) => Promise<void>;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,

  clearSession: () => set({ token: null, user: null }),

  setUser: (user) => set({ user }),

  login: async (data) => {
    try {
      const response = await authApi.login(data);
      const { access_token, user } = response.data;
      await setToken(access_token);
      set({ token: access_token, user });
      Sentry.setUser({ id: user.id, email: user.email });
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  signup: async (data) => {
    try {
      const response = await authApi.signup(data);
      const { access_token, user } = response.data;
      await setToken(access_token);
      set({ token: access_token, user });
      Sentry.setUser({ id: user.id, email: user.email });
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  logout: async () => {
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
      const response = await authApi.me(token);
      set({ token, user: response.data, isLoading: false });
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
