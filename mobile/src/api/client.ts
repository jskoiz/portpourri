import axios, { AxiosHeaders } from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { handleUnauthorized } from './authSession';
import { getToken } from './tokenStorage';
import { showToast } from '../store/toastStore';
import { parseRetryAfter } from './errors';
import { logTransientApiClientFailure } from './observability';

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
        if (!hasAuthorizationHeader(config.headers)) {
            const token = await getToken();
            if (token) {
                setAuthorizationHeader(config.headers, `Bearer ${token}`);
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

function hasAuthorizationHeader(
    headers: InternalAxiosRequestConfig['headers'] | undefined,
): boolean {
    if (!headers) return false;

    if (headers instanceof AxiosHeaders) {
        return headers.has('Authorization');
    }

    const headerBag = headers as Record<string, unknown>;
    return Boolean(headerBag.Authorization || headerBag.authorization);
}

function setAuthorizationHeader(
    headers: InternalAxiosRequestConfig['headers'] | undefined,
    value: string,
) {
    if (!headers) return;

    if (headers instanceof AxiosHeaders) {
        headers.set('Authorization', value);
        return;
    }

    const headerBag = headers as Record<string, unknown>;
    headerBag.Authorization = value;
}

// ---------------------------------------------------------------------------
// Auto-retry for 429 on idempotent GET requests
// ---------------------------------------------------------------------------

const MAX_429_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 2000;
const MAX_RETRY_DELAY_MS = 30000;
const RETRY_COUNT_KEY = '__retryCount';

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRequestLabel(config?: InternalAxiosRequestConfig): string {
    const method = config?.method?.toUpperCase() ?? 'REQUEST';
    const url = config?.url ?? 'unknown-url';
    return `${method} ${url}`;
}

function getRetryDelayMs(error: AxiosError): number {
    const retryAfterHeader = error.response?.headers?.['retry-after'] as
        | string
        | undefined;
    const retryAfterSeconds = parseRetryAfter(retryAfterHeader);
    if (retryAfterSeconds !== undefined) {
        return Math.min(retryAfterSeconds * 1000, MAX_RETRY_DELAY_MS);
    }
    return DEFAULT_RETRY_DELAY_MS;
}

function notifyTransientFailure(
    error: AxiosError,
    config?: InternalAxiosRequestConfig,
): void {
    const status = error.response?.status;
    const requestLabel = getRequestLabel(config);
    const message =
        status && status >= 500
            ? 'BRDG is having trouble right now. Please try again in a moment.'
            : 'BRDG could not reach the server. Check your connection and try again.';
    const dedupeKey =
        status && status >= 500 ? 'api:server-error' : 'api:network-error';

    logTransientApiClientFailure(requestLabel, status, error.message);
    showToast(message, 'error', undefined, { dedupeKey });
}

client.interceptors.response.use(
    (response) => {
        if (__DEV__) {
            const { devContractInterceptor } = require('./contractValidator');
            return devContractInterceptor(response);
        }
        return response;
    },
    async (error: AxiosError) => {
        // Cancelled requests (e.g. navigation/unmount) are expected noise — skip all handling.
        if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') {
            return Promise.reject(error);
        }

        const config = error.config as InternalAxiosRequestConfig & {
            [RETRY_COUNT_KEY]?: number;
        } | undefined;

        // Auto-retry: only for 429 on GET requests
        if (
            error.response?.status === 429 &&
            config &&
            config.method?.toUpperCase() === 'GET'
        ) {
            const retryCount = config[RETRY_COUNT_KEY] ?? 0;
            if (retryCount < MAX_429_RETRIES) {
                config[RETRY_COUNT_KEY] = retryCount + 1;
                const delayMs = getRetryDelayMs(error);
                await sleep(delayMs);
                return client.request(config);
            }
        }

        if (error?.response?.status === 401) {
            await handleUnauthorized();
        } else if (!error?.response) {
            notifyTransientFailure(error, config);
        } else if (error.response.status >= 500) {
            notifyTransientFailure(error, config);
        }

        return Promise.reject(error);
    }
);

export default client;
