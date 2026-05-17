import { ErrorCodes, ForbiddenException } from '@common/exceptions';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.emailVerified) {
      throw new ForbiddenException(ErrorCodes.Email.NOT_VERIFIED);
    }

    return true;
  }
}
