import * as Sentry from '@sentry/react-native';
import { env } from '../config/env';
import { normalizeApiError } from './errors';

export function logApiFailure(
  domain: 'auth' | 'profile' | 'discovery' | 'events' | 'matches' | 'notifications',
  action: string,
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  const normalized = normalizeApiError(error);
  const failureContext = {
    ...context,
    status: normalized.status,
    code: normalized.code,
    message: normalized.message,
    isNetworkError: normalized.isNetworkError,
    retryable: normalized.retryable,
  };

  if (env.sentryDsn) {
    Sentry.addBreadcrumb({
      category: 'api',
      type: 'error',
      level: 'error',
      message: `[api:${domain}] ${action} failed`,
      data: {
        domain,
        action,
        ...failureContext,
      },
    });
  }

  if (__DEV__) {
    console.warn(`[api:${domain}] ${action} failed`, failureContext);
  }
}
