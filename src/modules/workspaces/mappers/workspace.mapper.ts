import { Workspace } from '@prisma/client';

import { WorkspaceResponseDto } from '../dto';

export const toWorkspaceResponse = (workspace: Workspace): WorkspaceResponseDto => ({
  id: workspace.id,
  ownerId: workspace.ownerId,
  name: workspace.name,
  type: workspace.type,
  createdAt: workspace.createdAt,
  updatedAt: workspace.updatedAt,
});
