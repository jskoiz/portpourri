import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { appConfig } from '../config/app.config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const { connectionLimit, connectionTimeout, url } = appConfig.database;

    super({
      datasources: {
        db: {
          url,
        },
      },
      log: appConfig.isProduction
        ? ['error', 'warn']
        : ['query', 'info', 'warn', 'error'],
    });

    // Note: Prisma connection pool is configured via DATABASE_URL query params:
    //   ?connection_limit=10&pool_timeout=10
    // Set DATABASE_CONNECTION_LIMIT and DATABASE_CONNECTION_TIMEOUT env vars
    // or append directly to DATABASE_URL for production tuning.
    this.logger.log(
      `PrismaService initialized (connection_limit=${connectionLimit}, pool_timeout=${connectionTimeout}s)`,
    );
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
