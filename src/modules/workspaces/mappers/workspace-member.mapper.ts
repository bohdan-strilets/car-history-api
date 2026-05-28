import { User, WorkspaceInvite, WorkspaceMember } from '@prisma/client';

import { WorkspaceInviteResponseDto, WorkspaceMemberWithUserResponseDto } from '../dto';

type WorkspaceMemberWithUser = WorkspaceMember & {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'avatarUrl'>;
};

export const toWorkspaceMemberResponse = (
  member: WorkspaceMemberWithUser,
): WorkspaceMemberWithUserResponseDto => ({
  id: member.id,
  workspaceId: member.workspaceId,
  userId: member.userId,
  role: member.role,
  createdAt: member.createdAt,
  updatedAt: member.updatedAt,
  user: member.user,
});

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
