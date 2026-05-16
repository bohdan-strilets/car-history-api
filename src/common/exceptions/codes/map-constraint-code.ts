import { ValidationCodes } from '../codes/validation-fields';

export const mapConstraintToCode = (constraint: string): string => {
  const map: Record<string, string> = {
    isEmail: ValidationCodes.INVALID_EMAIL,
    isNotEmpty: ValidationCodes.REQUIRED,
    minLength: ValidationCodes.TOO_SHORT,
    maxLength: ValidationCodes.TOO_LONG,
    isUrl: ValidationCodes.INVALID_URL,
    isUuid: ValidationCodes.INVALID_UUID,
    isPhoneNumber: ValidationCodes.INVALID_PHONE,
    min: ValidationCodes.TOO_SMALL,
    max: ValidationCodes.TOO_LARGE,
    isInt: ValidationCodes.MUST_BE_INTEGER,
    isPositive: ValidationCodes.MUST_BE_POSITIVE,
    isEnum: ValidationCodes.INVALID_ENUM,
    isDateString: ValidationCodes.INVALID_DATE,
    isString: ValidationCodes.INVALID_FORMAT,
    isNumber: ValidationCodes.INVALID_FORMAT,
    isBoolean: ValidationCodes.INVALID_FORMAT,
  };

  return map[constraint] ?? ValidationCodes.INVALID_FORMAT;
};
