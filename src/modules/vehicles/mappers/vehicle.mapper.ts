import { Vehicle } from '@prisma/client';

import { VehicleResponseDto } from '../dto';

export const toVehicleResponse = (vehicle: Vehicle): VehicleResponseDto => ({
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
  createdAt: vehicle.createdAt,
});
