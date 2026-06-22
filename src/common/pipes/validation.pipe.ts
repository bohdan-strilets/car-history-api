import { AppException, ErrorCodes, mapConstraintToCode } from '@common/exceptions';
import { HttpStatus, ValidationPipe } from '@nestjs/common';

export const createValidationPipe = () =>
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => {
      const fields: Record<string, string> = {};

      for (const error of errors) {
        const constraints = error.constraints ?? {};
        const firstConstraint = Object.keys(constraints)[0];
        fields[error.property] = mapConstraintToCode(firstConstraint);
      }

      return new AppException({
        errorCode: ErrorCodes.General.VALIDATION_ERROR,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        details: { fields },
      });
    },
  });
