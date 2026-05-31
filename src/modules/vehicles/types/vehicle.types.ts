import { BodyType, DriveType, FuelType, Transmission, Vehicle } from '@prisma/client';

export interface VehiclePurchaseInfo {
  date?: string;
  price?: number;
  mileage?: number;
}

export interface VehicleSaleInfo {
  date?: string;
  price?: number;
  mileage?: number;
}

export interface VehicleSpecs {
  // Engine
  engineCode?: string;
  enginePowerHp?: number;
  enginePowerKw?: number;
  torqueNm?: number;
  cylindersCount?: number;
  engineLayout?: string;
  turbo?: boolean;

  // Transmission
  gearsCount?: number;

  // Consumption
  fuelTankCapacity?: number;
  cityConsumption?: number;
  highwayConsumption?: number;
  combinedConsumption?: number;

  // Electric / Hybrid
  batteryCapacityKwh?: number;
  electricRangeKm?: number;

  // Performance
  accelerationSec?: number;
  topSpeedKmh?: number;

  // Dimensions
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  weightKg?: number;
  wheelbaseMm?: number;
  groundClearanceMm?: number;
  trunkVolumeLiters?: number;

  // Interior
  numberOfDoors?: number;
  numberOfSeats?: number;
  airbagsCount?: number;

  // Safety & Eco
  euroStandard?: string;
  ncapRating?: number;
  co2EmissionGKm?: number;

  // Tires
  tireSizeFront?: string;
  tireSizeRear?: string;

  // Registration
  firstRegistrationDate?: string;
}

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
  purchaseInfo?: VehiclePurchaseInfo;
  saleInfo?: VehicleSaleInfo;
  specs?: VehicleSpecs;
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
