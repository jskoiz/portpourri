import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { appConfig } from './config/app.config';

if (appConfig.sentry.dsn) {
  Sentry.init({
    dsn: appConfig.sentry.dsn,
    environment: appConfig.environment,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.1,
  });
}
