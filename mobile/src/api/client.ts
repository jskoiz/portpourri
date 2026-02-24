import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '../config/env';
import { STORAGE_KEYS } from '../constants/storage';

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
            await AsyncStorage.removeItem(STORAGE_KEYS.accessToken);
        }
        return Promise.reject(error);
    }
);

export default client;
