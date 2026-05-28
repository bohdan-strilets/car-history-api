import { Role, WorkspaceMember } from '@prisma/client';

import { WorkspaceUserInfo } from './workspace.type';

export interface CreateWorkspaceMemberInput {
  workspaceId: string;
  userId: string;
  role: Role;
}

export interface CreateWorkspaceInviteInput {
  workspaceId: string;
  invitedById: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: Date;
}

export interface WorkspaceMemberWithUser extends WorkspaceMember {
  user: WorkspaceUserInfo;
}
