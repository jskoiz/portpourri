import { logApiFailure } from '../../api/observability';

export type ApiDomain = Parameters<typeof logApiFailure>[0];

export async function withErrorLogging<T>(
  domain: ApiDomain,
  action: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logApiFailure(domain, action, error, context);
    throw error;
  }
}
