import { MediaEntity } from '@prisma/client';

export interface BuildFolderParams {
  entityType: MediaEntity;
  entityId: string;
  category: string;
  workspaceId?: string;
  vehicleId?: string;
}
