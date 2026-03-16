import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { authApi } from "../services/api";
import { STORAGE_KEYS } from "../constants/storage";
import { normalizeApiError } from "../api/errors";
import type { User } from "../api/types";

// expo-secure-store has no web implementation; fall back to localStorage
const storage = {
  getItemAsync: (key: string) =>
    Platform.OS === "web"
      ? Promise.resolve(localStorage.getItem(key))
      : SecureStore.getItemAsync(key),
  setItemAsync: (key: string, value: string) =>
    Platform.OS === "web"
      ? Promise.resolve(localStorage.setItem(key, value))
      : SecureStore.setItemAsync(key, value),
  deleteItemAsync: (key: string) =>
    Platform.OS === "web"
      ? Promise.resolve(localStorage.removeItem(key))
      : SecureStore.deleteItemAsync(key),
};

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
      await storage.setItemAsync(STORAGE_KEYS.accessToken, access_token);
      set({ token: access_token, user });
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  signup: async (data) => {
    try {
      const response = await authApi.signup(data);
      const { access_token, user } = response.data;
      await storage.setItemAsync(STORAGE_KEYS.accessToken, access_token);
      set({ token: access_token, user });
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  logout: async () => {
    await storage.deleteItemAsync(STORAGE_KEYS.accessToken);
    get().clearSession();
  },

  deleteAccount: async () => {
    try {
      await authApi.deleteAccount();
    } catch (error) {
      throw normalizeApiError(error);
    }

    try {
      await storage.deleteItemAsync(STORAGE_KEYS.accessToken);
    } finally {
      get().clearSession();
    }
  },

  loadToken: async () => {
    set({ isLoading: true });
    const token = await storage.getItemAsync(STORAGE_KEYS.accessToken);
    if (!token) {
      set({ token: null, user: null, isLoading: false });
      return;
    }

    try {
      const response = await authApi.me(token);
      set({ token, user: response.data, isLoading: false });
    } catch {
      await storage.deleteItemAsync(STORAGE_KEYS.accessToken);
      set({ token: null, user: null, isLoading: false });
    }
  },
}));
