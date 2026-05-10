import { HttpException } from '@nestjs/common';

import { AppExceptionOptions } from './exceptions.types';

export class AppException extends HttpException {
  readonly errorCode: string;
  readonly details: Record<string, unknown>;

  constructor({ statusCode, errorCode, details = {} }: AppExceptionOptions) {
    super({ statusCode, errorCode, details }, statusCode);
    this.errorCode = errorCode;
    this.details = details;
  }
}
