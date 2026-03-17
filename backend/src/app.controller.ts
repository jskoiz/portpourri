import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from './prisma/prisma.service';

@Controller()
@ApiTags('App')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

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

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return res.status(HttpStatus.OK).json({ status: 'ok', timestamp });
    } catch {
      return res
        .status(HttpStatus.SERVICE_UNAVAILABLE)
        .json({ status: 'error', timestamp, error: 'Database connection failed' });
    }
  }
}
