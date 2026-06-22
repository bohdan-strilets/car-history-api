import { MaintenanceInterval } from '@prisma/client';

import { MaintenanceIntervalResponseDto } from '../dto';

export function toMaintenanceIntervalResponse(
  interval: MaintenanceInterval,
): MaintenanceIntervalResponseDto {
  return {
    id: interval.id,
    vehicleId: interval.vehicleId,
    type: interval.type,
    title: interval.title,
    intervalKm: interval.intervalKm,
    intervalMonths: interval.intervalMonths,
    lastServiceMileage: interval.lastServiceMileage,
    lastServiceDate: interval.lastServiceDate?.toISOString() ?? null,
    nextServiceMileage: interval.nextServiceMileage,
    nextServiceDate: interval.nextServiceDate?.toISOString() ?? null,
    status: interval.status,
    createdAt: interval.createdAt.toISOString(),
    updatedAt: interval.updatedAt.toISOString(),
  };
}
