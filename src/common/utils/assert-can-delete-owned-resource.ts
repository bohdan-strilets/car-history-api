import { ErrorCodes, ForbiddenException } from '@common/exceptions';
import { Role } from '@prisma/client';

export const assertCanDeleteOwnedResource = (params: {
  memberRole: Role;
  resourceCreatedBy: string | null;
  userId: string;
}): void => {
  const { memberRole, resourceCreatedBy, userId } = params;

  const isPrivilegedRole = memberRole === Role.OWNER || memberRole === Role.ADMIN;
  const isOwnResource = resourceCreatedBy === userId;

  if (!isPrivilegedRole && !isOwnResource) {
    throw new ForbiddenException(ErrorCodes.Workspace.INSUFFICIENT_ROLE);
  }
};
