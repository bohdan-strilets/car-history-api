import { WorkspaceInviteResponseDto, WorkspaceMemberWithUserResponseDto } from '../dto';
import { WorkspaceInviteWithWorkspace, WorkspaceMemberWithUser } from '../types';

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

export const toWorkspaceInviteResponse = (
  invite: WorkspaceInviteWithWorkspace,
): WorkspaceInviteResponseDto => ({
  id: invite.id,
  workspaceId: invite.workspaceId,
  invitedById: invite.invitedById,
  email: invite.email,
  role: invite.role,
  status: invite.status,
  workspace: invite.workspace,
  expiresAt: invite.expiresAt,
  createdAt: invite.createdAt,
});
