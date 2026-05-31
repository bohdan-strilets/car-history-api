import { BodyType, DriveType, FuelType, Transmission, Vehicle } from '@prisma/client';

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

export type VehicleUserInfo = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

export type VehicleWithOwner = Vehicle & {
  owner: VehicleUserInfo;
};
