import axios from 'axios';
import { Platform } from 'react-native';
import { env } from '../config/env';
import { STORAGE_KEYS } from '../constants/storage';
import * as SecureStore from 'expo-secure-store';
import { handleUnauthorized } from './authSession';

// expo-secure-store has no web implementation; fall back to localStorage
const getToken = (key: string) =>
    Platform.OS === 'web'
        ? Promise.resolve(localStorage.getItem(key))
        : SecureStore.getItemAsync(key);

const client = axios.create({
    baseURL: env.apiUrl,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

client.interceptors.request.use(
    async (config) => {
        // Only inject the stored token when the caller has not already supplied an
        // Authorization header.  This lets call-sites pass an explicit token (e.g.
        // authApi.me) without having it silently overwritten by the interceptor.
        if (!config.headers.Authorization) {
            const token = await getToken(STORAGE_KEYS.accessToken);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

client.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error?.response?.status === 401) {
            await handleUnauthorized();
        }
        return Promise.reject(error);
    }
);

export default client;
