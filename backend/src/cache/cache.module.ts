import { Module, Logger } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { appConfig } from '../config/app.config';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const logger = new Logger('AppCacheModule');
        try {
          const { redisStore } = await import('cache-manager-ioredis-yet');
          const store = await redisStore({
            host: appConfig.redis.host,
            port: appConfig.redis.port,
          });
          logger.log('Redis cache connected');
          return { store, ttl: 300_000 };
        } catch (error) {
          logger.warn(
            `Redis unavailable, falling back to in-memory cache: ${error instanceof Error ? error.message : String(error)}`,
          );
          return { ttl: 300_000 };
        }
      },
    }),
  ],
})
export class AppCacheModule {}
