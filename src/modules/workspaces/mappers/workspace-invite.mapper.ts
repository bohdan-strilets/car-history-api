import { WorkspaceInvite } from '@prisma/client';

import { WorkspaceInviteResponseDto } from '../dto';

export const toWorkspaceInviteResponse = (invite: WorkspaceInvite): WorkspaceInviteResponseDto => ({
  id: invite.id,
  workspaceId: invite.workspaceId,
  invitedById: invite.invitedById,
  email: invite.email,
  role: invite.role,
  status: invite.status,
  expiresAt: invite.expiresAt,
  createdAt: invite.createdAt,
});
