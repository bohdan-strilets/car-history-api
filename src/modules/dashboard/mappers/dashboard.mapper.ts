import { VehicleResponseDto } from '@modules/vehicles';
import { DocumentType } from '@prisma/client';

import { DashboardVehicleResponseDto } from '../dto';

export const toDashboardVehicleResponse = (
  vehicle: VehicleResponseDto,
  nearestDocument: { expireDate: Date; type: DocumentType } | undefined,
): DashboardVehicleResponseDto => ({
  ...vehicle,
  nearestDocumentExpireDate: nearestDocument?.expireDate.toISOString() ?? null,
  nearestDocumentType: nearestDocument?.type ?? null,
});
