import { IS_PUBLIC_KEY } from '@common/decorators';
import { ErrorCodes, UnauthorizedException } from '@common/exceptions';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<T>(err: Error, user: T, info: Error): T {
    if (err || !user) {
      const message = info?.message;
      if (message === 'jwt expired') {
        throw new UnauthorizedException(ErrorCodes.Auth.ACCESS_TOKEN_EXPIRED);
      }
      throw new UnauthorizedException(ErrorCodes.Auth.ACCESS_TOKEN_INVALID);
    }
    return user;
  }
}
