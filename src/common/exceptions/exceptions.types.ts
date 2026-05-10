import { HttpStatus } from '@nestjs/common';

import { ValidationCode } from './codes/validation-fields';

export type ValidationFields = Record<string, ValidationCode>;

export interface AppExceptionOptions {
  statusCode: HttpStatus;
  errorCode: string;
  details?: Record<string, unknown>;
}
