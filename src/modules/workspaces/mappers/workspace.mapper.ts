import { Role } from '@prisma/client';

import { WorkspaceResponseDto, WorkspaceWithOwnerResponseDto } from '../dto';
import { WorkspaceWithMeta, WorkspaceWithOwner } from '../types';

export const toWorkspaceResponse = (workspace: WorkspaceWithMeta): WorkspaceResponseDto => ({
  id: workspace.id,
  ownerId: workspace.ownerId,
  name: workspace.name,
  type: workspace.type,
  role: workspace.members[0].role,
  membersCount: workspace._count.members,
  createdAt: workspace.createdAt,
  updatedAt: workspace.updatedAt,
});

export const toWorkspaceWithOwnerResponse = (
  workspace: WorkspaceWithOwner,
  role: Role,
): WorkspaceWithOwnerResponseDto => ({
  id: workspace.id,
  ownerId: workspace.ownerId,
  name: workspace.name,
  type: workspace.type,
  role,
  membersCount: workspace._count.members,
  createdAt: workspace.createdAt,
  updatedAt: workspace.updatedAt,
  owner: workspace.owner,
});
