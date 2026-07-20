import { ErrorCodes, ForbiddenException, NotFoundException } from '@common/exceptions';
import { AiService } from '@modules/ai';
import { Injectable } from '@nestjs/common';
import { PrismaTxClient } from '@prisma/prisma.types';

import {
  CreateVehicleDto,
  UpdateVehicleDto,
  UpdateVehicleSpecsDto,
  VehicleResponseDto,
} from './dto';
import { toVehicleResponse } from './mappers';
import { VehicleSpecs, VehicleWithOwner } from './types';
import { VehiclesRepo } from './vehicles.repository';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly vehiclesRepo: VehiclesRepo,
    private readonly aiService: AiService,
  ) {}

  // ─── Queries ──────────────────────────────────────────────────────────────

  async getById(vehicleId: string): Promise<VehicleWithOwner> {
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

  async update(
    workspaceId: string,
    vehicleId: string,
    dto: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.getById(vehicleId);

    if (vehicle.workspaceId !== workspaceId) {
      throw new ForbiddenException(ErrorCodes.Vehicle.ACCESS_DENIED);
    }

    const updated = await this.vehiclesRepo.update(vehicleId, dto);
    return toVehicleResponse(updated);
  }

  async updateSpecs(
    workspaceId: string,
    vehicleId: string,
    dto: UpdateVehicleSpecsDto,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.getById(vehicleId);

    if (vehicle.workspaceId !== workspaceId) {
      throw new ForbiddenException(ErrorCodes.Vehicle.ACCESS_DENIED);
    }

    const updated = await this.vehiclesRepo.update(vehicleId, {
      specs: dto as VehicleSpecs,
    });

    return toVehicleResponse(updated);
  }

  async delete(workspaceId: string, vehicleId: string): Promise<void> {
    const vehicle = await this.getById(vehicleId);

    if (vehicle.workspaceId !== workspaceId) {
      throw new ForbiddenException(ErrorCodes.Vehicle.ACCESS_DENIED);
    }

    await this.vehiclesRepo.softDelete(vehicleId);
  }

  async softDeleteAllByWorkspaceId(workspaceId: string, tx?: PrismaTxClient): Promise<void> {
    await this.vehiclesRepo.softDeleteAllByWorkspaceId(workspaceId, tx);
  }

  async fillSpecsWithAi(workspaceId: string, vehicleId: string): Promise<VehicleResponseDto> {
    const vehicle = await this.getById(vehicleId);

    if (vehicle.workspaceId !== workspaceId) {
      throw new ForbiddenException(ErrorCodes.Vehicle.ACCESS_DENIED);
    }

    const specs = await this.aiService.fillVehicleSpecs({
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      generation: vehicle.generation,
      engineDisplacementCc: vehicle.engineDisplacementCc,
      fuelType: vehicle.fuelType,
    });

    const updated = await this.vehiclesRepo.update(vehicleId, {
      specs: specs as VehicleSpecs,
    });

    return toVehicleResponse(updated);
  }
}
