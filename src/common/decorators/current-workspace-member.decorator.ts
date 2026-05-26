import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { WorkspaceMember } from '@prisma/client';
import { Request } from 'express';

export const CurrentWorkspaceMember = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): WorkspaceMember => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.workspaceMember as WorkspaceMember;
  },
);
