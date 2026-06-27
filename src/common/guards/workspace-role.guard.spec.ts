import { WORKSPACE_ROLE_OPTIONS } from '@common/decorators';
import { ErrorCodes } from '@common/exceptions';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

import { WorkspaceRoleGuard } from './workspace-role.guard';

describe('WorkspaceRoleGuard', () => {
  const createContext = (role: Role): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          workspaceMember: { role },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as ExecutionContext;

  it('дозволяє доступ owner/admin до admin-only дій', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.OWNER, Role.ADMIN]),
    } as unknown as Reflector;
    const guard = new WorkspaceRoleGuard(reflector);

    expect(guard.canActivate(createContext(Role.OWNER))).toBe(true);
    expect(guard.canActivate(createContext(Role.ADMIN))).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(WORKSPACE_ROLE_OPTIONS, [
      expect.any(Object),
      expect.any(Object),
    ]);
  });

  it('блокує privilege escalation для member', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.OWNER, Role.ADMIN]),
    } as unknown as Reflector;
    const guard = new WorkspaceRoleGuard(reflector);

    expect(() => guard.canActivate(createContext(Role.MEMBER))).toThrowError(
      expect.objectContaining({
        errorCode: ErrorCodes.Workspace.INSUFFICIENT_ROLE,
      }),
    );
  });
});
