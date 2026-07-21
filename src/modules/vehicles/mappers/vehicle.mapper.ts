import { TireType } from '@prisma/client';

import { VehicleResponseDto } from '../dto';
import {
  VehicleFuelConsumptionInfo,
  VehicleInsuranceInfo,
  VehicleLatestMilestoneInfo,
  VehicleNextMaintenanceInfo,
  VehiclePurchaseInfo,
  VehicleSaleInfo,
  VehicleSpecs,
  VehicleWithOwner,
} from '../types';

const DEFAULT_INSURANCE: VehicleInsuranceInfo = { status: 'MISSING', expireDate: null };
const DEFAULT_FUEL_CONSUMPTION: VehicleFuelConsumptionInfo = { value: null, source: null };

export const toVehicleResponse = (
  vehicle: VehicleWithOwner,
  primaryPhotoUrl: string | null = null,
  monthlyExpenses: number = 0,
  insurance: VehicleInsuranceInfo = DEFAULT_INSURANCE,
  tireSeason: TireType | null = null,
  activeRemindersCount: number = 0,
  nextMaintenance: VehicleNextMaintenanceInfo | null = null,
  latestMilestone: VehicleLatestMilestoneInfo | null = null,
  fuelConsumption: VehicleFuelConsumptionInfo = DEFAULT_FUEL_CONSUMPTION,
): VehicleResponseDto => ({
  id: vehicle.id,
  ownerId: vehicle.ownerId,
  workspaceId: vehicle.workspaceId,
  brand: vehicle.brand,
  model: vehicle.model,
  year: vehicle.year,
  generation: vehicle.generation,
  nickname: vehicle.nickname,
  vin: vehicle.vin,
  plateNumber: vehicle.plateNumber,
  engineDisplacementCc: vehicle.engineDisplacementCc,
  bodyType: vehicle.bodyType,
  fuelType: vehicle.fuelType,
  transmission: vehicle.transmission,
  driveType: vehicle.driveType,
  color: vehicle.color,
  currentMileage: vehicle.currentMileage,
  description: vehicle.description,
  countryOfOrigin: vehicle.countryOfOrigin,
  status: vehicle.status,
  owner: vehicle.owner,
  purchaseInfo: vehicle.purchaseInfo as VehiclePurchaseInfo | null,
  saleInfo: vehicle.saleInfo as VehicleSaleInfo | null,
  specs: vehicle.specs as VehicleSpecs | null,
  primaryPhotoUrl,
  monthlyExpenses,
  insurance,
  tireSeason,
  activeRemindersCount,
  nextMaintenance,
  latestMilestone,
  fuelConsumption,
  createdAt: vehicle.createdAt,
});
