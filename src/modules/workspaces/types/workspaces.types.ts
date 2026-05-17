import { Role, WorkspaceType } from '@prisma/client';

export interface CreateWorkspaceInput {
  ownerId: string;
  name: string;
  type: WorkspaceType;
}

export interface CreateWorkspaceMemberInput {
  workspaceId: string;
  userId: string;
  role: Role;
}
