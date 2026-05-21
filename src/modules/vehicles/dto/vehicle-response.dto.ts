import { BodyType, DriveType, FuelType, Transmission, VehicleStatus } from '@prisma/client';

export class VehicleResponseDto {
  declare id: string;
  declare ownerId: string;
  declare workspaceId: string;
  declare brand: string;
  declare model: string;
  declare year: number;
  declare generation: string | null;
  declare nickname: string | null;
  declare vin: string | null;
  declare plateNumber: string;
  declare engineDisplacementCc: number;
  declare bodyType: BodyType;
  declare fuelType: FuelType[];
  declare transmission: Transmission;
  declare driveType: DriveType;
  declare color: string;
  declare currentMileage: number;
  declare description: string | null;
  declare countryOfOrigin: string | null;
  declare status: VehicleStatus;
  declare createdAt: Date;
}
