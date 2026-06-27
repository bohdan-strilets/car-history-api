import { SECURITY } from '@common/constants';
import { getCsrfTokenFromCookie } from '@common/cookie';
import { ErrorCodes, UnauthorizedException } from '@common/exceptions';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthCsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const cookieToken = getCsrfTokenFromCookie(request);
    const headerToken = request.headers[SECURITY.CSRF_HEADER_NAME];

    const csrfHeader = typeof headerToken === 'string' ? headerToken : null;

    if (!cookieToken || !csrfHeader || cookieToken !== csrfHeader) {
      throw new UnauthorizedException(ErrorCodes.Auth.CSRF_TOKEN_INVALID);
    }

    return true;
  }
}
