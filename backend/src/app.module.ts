import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import * as crypto from 'crypto';
import helmet from 'helmet';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { MatchesModule } from './matches/matches.module';
import { EventsModule } from './events/events.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ModerationModule } from './moderation/moderation.module';
import { VerificationModule } from './verification/verification.module';
import { appConfig } from './config/app.config';

const isProduction = appConfig.isProduction;

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (_req, res) => {
          const id = crypto.randomUUID();
          res.setHeader('X-Trace-Id', id);
          return id;
        },
        customProps: () => ({ context: 'HTTP' }),
        customSuccessMessage: (req, res) =>
          `${req.method} ${req.url} ${res.statusCode}`,
        customErrorMessage: (req, res) =>
          `${req.method} ${req.url} ${res.statusCode}`,
        customAttributeKeys: {
          req: 'request',
          res: 'response',
          err: 'error',
          responseTime: 'responseTimeMs',
        },
        customLogLevel: (_req, res, err) => {
          if (err || (res.statusCode && res.statusCode >= 500))
            return 'error';
          if (res.statusCode && res.statusCode >= 400) return 'warn';
          return 'info';
        },
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
        transport: isProduction
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
                translateTime: 'SYS:HH:MM:ss.l',
                ignore: 'pid,hostname',
              },
            },
        level: isProduction ? 'info' : 'debug',
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    AuthModule,
    PrismaModule,
    ProfileModule,
    DiscoveryModule,
    MatchesModule,
    EventsModule,
    NotificationsModule,
    ModerationModule,
    VerificationModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(helmet())
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
