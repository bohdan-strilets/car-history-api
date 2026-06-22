import { MaintenanceStatus, MaintenanceType } from '@prisma/client';

export class MaintenanceIntervalResponseDto {
  declare id: string;
  declare vehicleId: string;
  declare type: MaintenanceType;
  declare title: string;
  declare intervalKm: number | null;
  declare intervalMonths: number | null;
  declare lastServiceMileage: number | null;
  declare lastServiceDate: string | null;
  declare nextServiceMileage: number | null;
  declare nextServiceDate: string | null;
  declare status: MaintenanceStatus;
  declare createdAt: string;
  declare updatedAt: string;
}
