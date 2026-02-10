import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

interface AuthState {
    token: string | null;
    user: any | null;
    isLoading: boolean;
    login: (data: any) => Promise<void>;
    signup: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    loadToken: () => Promise<void>;
    setUser: (user: any) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    isLoading: true,

    setUser: (user) => set({ user }),

    login: async (data) => {
        const response = await client.post('/auth/login', data);
        const { access_token, user } = response.data;
        await AsyncStorage.setItem('access_token', access_token);
        set({ token: access_token, user });
    },

    signup: async (data) => {
        const response = await client.post('/auth/signup', data);
        const { access_token, user } = response.data;
        await AsyncStorage.setItem('access_token', access_token);
        set({ token: access_token, user });
    },

    logout: async () => {
        await AsyncStorage.removeItem('access_token');
        set({ token: null, user: null });
    },

    loadToken: async () => {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
            try {
                // Set token in header manually for this request since interceptor might be async/race condition
                const response = await client.get('/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                set({ token, user: response.data, isLoading: false });
            } catch (error) {
                console.error('Failed to load user profile', error);
                await AsyncStorage.removeItem('access_token');
                set({ token: null, user: null, isLoading: false });
            }
        } else {
            set({ token: null, isLoading: false });
        }
    },
}));
