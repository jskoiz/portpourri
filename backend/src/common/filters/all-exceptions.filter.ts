import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface PrismaError {
  code: string;
  meta?: Record<string, unknown>;
}

function isPrismaError(error: unknown): error is PrismaError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as PrismaError).code === 'string' &&
    (error as PrismaError).code.startsWith('P')
  );
}

function prismaErrorToHttp(error: PrismaError): {
  status: number;
  message: string;
} {
  switch (error.code) {
    case 'P2025':
      return { status: 404, message: 'Record not found' };
    case 'P2002':
      return {
        status: 409,
        message: 'A record with this value already exists',
      };
    case 'P2003':
      return { status: 400, message: 'Related record not found' };
    default:
      return { status: 500, message: 'Internal server error' };
  }
}

/** Extract the pino-http trace ID from the request, if available. */
function getTraceId(request: Request): string | undefined {
  return (request as Request & { id?: string }).id;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = getTraceId(request);

    // Handle Prisma-specific errors with appropriate HTTP status codes
    if (isPrismaError(exception)) {
      const { status, message } = prismaErrorToHttp(exception);

      this.logger.error(
        `${request.method} ${request.url} ${status}: Prisma ${exception.code} – ${message} [traceId=${traceId ?? 'n/a'}]`,
        exception instanceof Error ? exception.stack : undefined,
      );

      response.status(status).json({ statusCode: status, message });
      return;
    }

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const message =
      exception instanceof Error ? exception.message : String(exception);

    this.logger.error(
      `${request.method} ${request.url} ${status}: ${message} [traceId=${traceId ?? 'n/a'}]`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response
      .status(status)
      .json(
        exception instanceof HttpException
          ? exception.getResponse()
          : { statusCode: status, message: 'Internal server error' },
      );
  }
}
