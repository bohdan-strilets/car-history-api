import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';

import { AppException } from '../app.exception';
import { ErrorCodes } from '../codes/error-codes';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, errorCode, details } = this.resolve(exception);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const logMessage = `[${request.method}] ${request.url} → ${statusCode}`;
      const isError = exception instanceof Error;
      const logStack = isError ? exception.stack : String(exception);
      this.logger.error(logMessage, logStack);
      Sentry.captureException(exception);
    }

    response.status(statusCode).json({ statusCode, errorCode, details });
  }

  // ─── Resolve ──────────────────────────────────────────────────────────────

  private resolve(exception: unknown): {
    statusCode: number;
    errorCode: string;
    details: Record<string, unknown>;
  } {
    if (exception instanceof AppException) {
      return {
        statusCode: exception.getStatus(),
        errorCode: exception.errorCode,
        details: exception.details,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError && exception.code === 'P2002') {
      return {
        statusCode: HttpStatus.CONFLICT,
        errorCode: ErrorCodes.General.CONFLICT,
        details: { fields: exception.meta?.target ?? [] },
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();

      return {
        statusCode,
        errorCode: ErrorCodes.General.UNKNOWN_ERROR,
        details: {},
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: ErrorCodes.General.INTERNAL_SERVER_ERROR,
      details: {},
    };
  }
}
