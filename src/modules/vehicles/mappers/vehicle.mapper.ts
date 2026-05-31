import { VehicleResponseDto } from '../dto';
import { VehicleWithOwner } from '../types';

export const toVehicleResponse = (vehicle: VehicleWithOwner): VehicleResponseDto => ({
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
  createdAt: vehicle.createdAt,
});
