import { CreateGoogleUserDto } from '@modules/users';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const GoogleUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CreateGoogleUserDto => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as CreateGoogleUserDto;
  },
);
