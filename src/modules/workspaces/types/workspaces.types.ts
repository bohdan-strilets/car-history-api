import { WorkspaceType } from '@prisma/client';

export interface CreateWorkspaceInput {
  ownerId: string;
  name: string;
  type: WorkspaceType;
}
