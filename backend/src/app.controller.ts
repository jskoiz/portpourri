import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from './prisma/prisma.service';
import { appConfig } from './config/app.config';

@Controller()
@ApiTags('App')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  private buildInfo() {
    return {
      environment: appConfig.build.environment,
      apiBaseUrl: appConfig.scripts.apiBaseUrl,
      gitSha: appConfig.build.gitSha,
      gitShortSha: appConfig.build.gitShortSha,
      imageTag: appConfig.build.imageTag,
      buildTime: appConfig.build.buildTime,
      source: appConfig.build.source,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Basic liveness check' })
  @ApiOkResponse({ description: 'Service is alive.' })
  getLiveness() {
    return { status: 'ok' };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check with database connectivity' })
  async getHealth(@Res() res: Response) {
    const timestamp = new Date().toISOString();
    const build = this.buildInfo();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return res.status(HttpStatus.OK).json({
        status: 'ok',
        timestamp,
        database: { status: 'ok' },
        build,
      });
    } catch {
      return res
        .status(HttpStatus.SERVICE_UNAVAILABLE)
        .json({
          status: 'error',
          timestamp,
          database: {
            status: 'error',
            error: 'Database connection failed',
          },
          build,
        });
    }
  }

  @Get('build-info')
  @ApiOperation({ summary: 'Return build provenance for the running backend' })
  @ApiOkResponse({ description: 'Build provenance returned successfully.' })
  getBuildInfo() {
    return this.buildInfo();
  }
}
