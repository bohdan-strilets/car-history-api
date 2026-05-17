import { ErrorCodes, NotFoundException } from '@common/exceptions';
import { Injectable } from '@nestjs/common';
import { Vehicle } from '@prisma/client';

import { CreateVehicleDto, VehicleResponseDto } from './dto';
import { toVehicleResponse } from './mappers';
import { VehiclesRepo } from './vehicles.repository';

@Injectable()
export class VehiclesService {
  constructor(private readonly vehiclesRepo: VehiclesRepo) {}

  // ─── Queries ──────────────────────────────────────────────────────────────

  async getById(vehicleId: string): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepo.findById(vehicleId);
    if (!vehicle) throw new NotFoundException(ErrorCodes.Vehicle.NOT_FOUND);
    return vehicle;
  }

  async getAllByWorkspaceId(workspaceId: string): Promise<VehicleResponseDto[]> {
    const vehicles = await this.vehiclesRepo.findAllByWorkspaceId(workspaceId);
    return vehicles.map(toVehicleResponse);
  }

  // ─── Commands ─────────────────────────────────────────────────────────────

  async create(
    userId: string,
    workspaceId: string,
    dto: CreateVehicleDto,
  ): Promise<VehicleResponseDto> {
    const mileage = dto.currentMileage ?? 0;

    const vehicle = await this.vehiclesRepo.create({
      ownerId: userId,
      workspaceId,
      ...dto,
      currentMileage: mileage,
      registrationMileage: mileage,
    });

    return toVehicleResponse(vehicle);
  }
}
