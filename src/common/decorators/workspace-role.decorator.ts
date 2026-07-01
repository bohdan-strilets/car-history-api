import { WORKSPACE_ROLE_OPTIONS } from '@common/constants';
import { JwtAuthGuard, WorkspaceMemberGuard, WorkspaceRoleGuard } from '@common/guards';
import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { Role } from '@prisma/client';

export const WorkspaceRole = (...roles: Role[]) =>
  applyDecorators(
    SetMetadata(WORKSPACE_ROLE_OPTIONS, roles),
    UseGuards(JwtAuthGuard, WorkspaceMemberGuard, WorkspaceRoleGuard),
  );
