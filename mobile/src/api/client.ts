import axios from 'axios';
import { env } from '../config/env';
import { STORAGE_KEYS } from '../constants/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleUnauthorized } from './authSession';

const client = axios.create({
    baseURL: env.apiUrl,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

client.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.accessToken);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
