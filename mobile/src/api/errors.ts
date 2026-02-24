import axios from 'axios';
import type { ApiErrorPayload } from './types';

export interface NormalizedApiError {
    message: string;
    status?: number;
    code?: string;
    isNetworkError: boolean;
    isUnauthorized: boolean;
    retryable: boolean;
}

export function normalizeApiError(error: unknown): NormalizedApiError {
    if (axios.isAxiosError<ApiErrorPayload>(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const message =
            data?.message ||
            data?.error ||
            error.message ||
            'Something went wrong. Please try again.';

        return {
            message,
            status,
            code: data?.code,
            isNetworkError: !error.response,
            isUnauthorized: status === 401,
            retryable: !status || status >= 500,
        };
    }

    if (error instanceof Error) {
        return {
            message: error.message,
            isNetworkError: false,
            isUnauthorized: false,
            retryable: false,
        };
    }

    return {
        message: 'Unexpected error occurred.',
        isNetworkError: false,
        isUnauthorized: false,
        retryable: false,
    };
}
