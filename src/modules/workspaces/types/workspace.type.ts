import { Role, Workspace, WorkspaceType } from '@prisma/client';

export interface CreateWorkspaceInput {
  ownerId: string;
  name: string;
  type: WorkspaceType;
}

export interface UpdateWorkspaceInput {
  name?: string;
  type?: WorkspaceType;
}

export interface WorkspaceUserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  type: WorkspaceType;
}

export interface WorkspaceWithOwner extends Workspace {
  owner: WorkspaceUserInfo;
  _count: { members: number };
}

export interface WorkspaceWithMeta extends Workspace {
  members: { role: Role }[];
  _count: { members: number };
}
