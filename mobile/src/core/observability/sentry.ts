import * as Sentry from '@sentry/react-native';
import { buildInfo } from '../../config/buildInfo';
import { env } from '../../config/env';

let initialized = false;

export function initSentry() {
  if (initialized || !env.sentryDsn) {
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    enabled: Boolean(env.sentryDsn),
    environment: buildInfo.appEnv,
    release:
      buildInfo.gitShortSha === 'unknown'
        ? undefined
        : `brdg-mobile@${buildInfo.version}+${buildInfo.gitShortSha}`,
    attachStacktrace: true,
  });

  initialized = true;
}

export { Sentry };
