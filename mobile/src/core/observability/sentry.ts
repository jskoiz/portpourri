import * as Sentry from '@sentry/react-native';
import { buildInfo } from '../../config/buildInfo';
import { env } from '../../config/env';

let initialized = false;
const sentryEnabled = Boolean(env.sentryDsn);

export function initSentry() {
  if (initialized || !sentryEnabled) {
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    enabled: sentryEnabled,
    environment: buildInfo.appEnv,
    release:
      buildInfo.gitShortSha === 'unknown'
        ? undefined
        : `brdg-mobile@${buildInfo.version}+${buildInfo.gitShortSha}`,
    attachStacktrace: true,
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.1,
    enableAutoPerformanceTracing: true,
  });

  initialized = true;
}

export function captureException(
  error: unknown,
  context: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  } = {},
) {
  if (!sentryEnabled) {
    return;
  }

  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(context.tags ?? {})) {
      scope.setTag(key, value);
    }

    for (const [key, value] of Object.entries(context.extra ?? {})) {
      scope.setExtra(key, value);
    }

    Sentry.captureException(error);
  });
}

export function addBreadcrumb(
  breadcrumb: Parameters<typeof Sentry.addBreadcrumb>[0],
) {
  if (!sentryEnabled) {
    return;
  }

  Sentry.addBreadcrumb(breadcrumb);
}

export function logDevOnly(
  level: 'warn' | 'error',
  message: string,
  context?: unknown,
) {
  if (!__DEV__) {
    return;
  }

  if (context === undefined) {
    console[level](message);
    return;
  }

  console[level](message, context);
}

export { Sentry };
