import { ErrorCodes, UnauthorizedException } from '@common/exceptions';
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
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
