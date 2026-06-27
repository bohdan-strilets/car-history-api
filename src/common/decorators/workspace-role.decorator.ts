import { JwtAuthGuard, WorkspaceMemberGuard, WorkspaceRoleGuard } from '@common/guards';
import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { Role } from '@prisma/client';

import { WORKSPACE_ROLE_OPTIONS } from './workspace-role.constants';

export const WorkspaceRole = (...roles: Role[]) =>
  applyDecorators(
    SetMetadata(WORKSPACE_ROLE_OPTIONS, roles),
    UseGuards(JwtAuthGuard, WorkspaceMemberGuard, WorkspaceRoleGuard),
  );
