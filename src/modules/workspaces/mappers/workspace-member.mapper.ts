import { WorkspaceMember } from '@prisma/client';

import { WorkspaceMemberResponseDto } from '../dto';

export const toWorkspaceMemberResponse = (member: WorkspaceMember): WorkspaceMemberResponseDto => ({
  id: member.id,
  workspaceId: member.workspaceId,
  userId: member.userId,
  role: member.role,
  createdAt: member.createdAt,
  updatedAt: member.updatedAt,
});
