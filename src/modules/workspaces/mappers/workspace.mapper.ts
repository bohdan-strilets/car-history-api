import { Workspace } from '@prisma/client';

import { WorkspaceResponseDto, WorkspaceWithOwnerResponseDto } from '../dto';
import { WorkspaceWithOwner } from '../types';

export const toWorkspaceResponse = (workspace: Workspace): WorkspaceResponseDto => ({
  id: workspace.id,
  ownerId: workspace.ownerId,
  name: workspace.name,
  type: workspace.type,
  createdAt: workspace.createdAt,
  updatedAt: workspace.updatedAt,
});

export const toWorkspaceWithOwnerResponse = (
  workspace: WorkspaceWithOwner,
): WorkspaceWithOwnerResponseDto => ({
  ...toWorkspaceResponse(workspace),
  owner: workspace.owner,
});
