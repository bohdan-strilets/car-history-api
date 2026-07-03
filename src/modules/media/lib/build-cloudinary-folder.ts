import { MediaEntity } from '@prisma/client';

import { BuildFolderParams } from './lib.types';

export const buildCloudinaryFolder = (params: BuildFolderParams): string => {
  const { entityType, entityId, category, workspaceId, vehicleId } = params;

  if (entityType === MediaEntity.USER) {
    return `Arvino/users/${entityId}/avatar`;
  }

  if (!workspaceId || !vehicleId) {
    throw new Error(`Missing workspaceId/vehicleId for entityType ${entityType}`);
  }

  const vehicleBase = `Arvino/workspaces/${workspaceId}/vehicles/${vehicleId}`;

  if (entityType === MediaEntity.VEHICLE) {
    return `${vehicleBase}/${category.toLowerCase()}`;
  }

  if (entityType === MediaEntity.DOCUMENT) {
    return `${vehicleBase}/documents/${entityId}`;
  }

  // SERVICE | EXPENSE | TRIP | TIRE → receipts
  return `${vehicleBase}/receipts/${entityType.toLowerCase()}/${entityId}`;
};
