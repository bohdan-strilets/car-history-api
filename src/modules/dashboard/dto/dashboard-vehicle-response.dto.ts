import { VehicleResponseDto } from '@modules/vehicles';
import { DocumentType } from '@prisma/client';

export class DashboardVehicleResponseDto extends VehicleResponseDto {
  declare nearestDocumentExpireDate: string | null;
  declare nearestDocumentType: DocumentType | null;
}
