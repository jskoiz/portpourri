import { normalizeApiError } from './errors';

export function logApiFailure(
  domain: 'auth' | 'profile' | 'discovery' | 'events' | 'matches',
  action: string,
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  const normalized = normalizeApiError(error);

  console.warn(`[api:${domain}] ${action} failed`, {
    ...context,
    status: normalized.status,
    code: normalized.code,
    message: normalized.message,
    isNetworkError: normalized.isNetworkError,
    retryable: normalized.retryable,
  });
}
