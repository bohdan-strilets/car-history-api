import { HttpStatus } from '@nestjs/common';

import { AppException } from './app.exception';
import { ErrorCodes } from './codes/error-codes';
import { ValidationFields } from './exceptions.types';

// 400 Bad Request

export class BadRequestException extends AppException {
  constructor(errorCode: string, details?: Record<string, unknown>) {
    super({ statusCode: HttpStatus.BAD_REQUEST, errorCode, details });
  }
}

// 401 Unauthorized

export class UnauthorizedException extends AppException {
  constructor(errorCode: string, details?: Record<string, unknown>) {
    super({ statusCode: HttpStatus.UNAUTHORIZED, errorCode, details });
  }
}

// 403 Forbidden

export class ForbiddenException extends AppException {
  constructor(errorCode: string, details?: Record<string, unknown>) {
    super({ statusCode: HttpStatus.FORBIDDEN, errorCode, details });
  }
}

// 404 Not Found

export class NotFoundException extends AppException {
  constructor(errorCode: string, details?: Record<string, unknown>) {
    super({ statusCode: HttpStatus.NOT_FOUND, errorCode, details });
  }
}

// 409 Conflict

export class ConflictException extends AppException {
  constructor(errorCode: string, details?: Record<string, unknown>) {
    super({ statusCode: HttpStatus.CONFLICT, errorCode, details });
  }
}

// 422 Unprocessable Entity

export class ValidationException extends AppException {
  constructor(fields: ValidationFields) {
    super({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      errorCode: ErrorCodes.General.VALIDATION_ERROR,
      details: { fields },
    });
  }
}
