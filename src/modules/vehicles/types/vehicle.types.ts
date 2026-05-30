import { BodyType, DriveType, FuelType, Transmission } from '@prisma/client';

export interface CreateVehicleInput {
  ownerId: string;
  workspaceId: string;
  brand: string;
  model: string;
  year: number;
  generation?: string;
  nickname?: string;
  vin?: string;
  plateNumber: string;
  engineDisplacementCc: number;
  bodyType: BodyType;
  fuelType: FuelType[];
  transmission: Transmission;
  driveType: DriveType;
  color: string;
  currentMileage: number;
  registrationMileage: number;
  description?: string;
  countryOfOrigin?: string;
}

export type UpdateVehicleInput = Partial<
  Omit<CreateVehicleInput, 'ownerId' | 'workspaceId' | 'registrationMileage'>
>;
