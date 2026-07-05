import { TireStatus, TireType } from '@prisma/client';

export class TireResponseDto {
  declare id: string;
  declare vehicleId: string;
  declare brand: string;
  declare model: string;
  declare type: TireType;
  declare width: number;
  declare aspectRatio: number;
  declare rimDiameter: number;
  declare price: string | null;
  declare status: TireStatus;
  declare storageLocation: string | null;
  declare mileageAtPurchase: number | null;
  declare quantity: number;
  declare purchaseAt: string | null;
  declare createdAt: string;
  declare updatedAt: string;
}
