import { WORKSPACE_ROLE_OPTIONS } from '@common/constants';
import { ErrorCodes, ForbiddenException } from '@common/exceptions';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, WorkspaceMember } from '@prisma/client';

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(WORKSPACE_ROLE_OPTIONS, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const member = request.workspaceMember as WorkspaceMember | undefined;

    if (!member || !roles.includes(member.role)) {
      throw new ForbiddenException(ErrorCodes.Workspace.INSUFFICIENT_ROLE);
    }

    return true;
  }
}
