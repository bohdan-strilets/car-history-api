import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { AppException } from '../app.exception';
import { ErrorCodes } from '../codes/error-codes';
import { ValidationCodes } from '../codes/validation-fields';

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

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const body = exception.getResponse();

      if (
        typeof body === 'object' &&
        body !== null &&
        'message' in body &&
        Array.isArray((body as Record<string, unknown>).message)
      ) {
        const fields = this.parseValidationMessages((body as { message: string[] }).message);
        return {
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          errorCode: ErrorCodes.General.VALIDATION_ERROR,
          details: { fields },
        };
      }

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

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private parseValidationMessages(messages: string[]): Record<string, string> {
    const fields: Record<string, string> = {};

    for (const message of messages) {
      const field = message.split(' ')[0];
      fields[field] = ValidationCodes.INVALID_FORMAT;
    }

    return fields;
  }
}
