import { Injectable } from '@nestjs/common';
import { Vehicle } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { PrismaTxClient } from '@prisma/prisma.types';

import { CreateVehicleInput, UpdateVehicleInput } from './types';

@Injectable()
export class VehiclesRepo {
  constructor(private readonly prisma: PrismaService) {}

  async findById(vehicleId: string): Promise<Vehicle | null> {
    return this.prisma.vehicle.findUnique({
      where: { id: vehicleId, deletedAt: null },
    });
  }

  async findAllByWorkspaceId(workspaceId: string): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: CreateVehicleInput, tx?: PrismaTxClient): Promise<Vehicle> {
    const client = tx ?? this.prisma;
    return client.vehicle.create({ data: input });
  }

  async update(vehicleId: string, data: UpdateVehicleInput, tx?: PrismaTxClient): Promise<Vehicle> {
    const client = tx ?? this.prisma;
    return client.vehicle.update({
      where: { id: vehicleId },
      data,
    });
  }

  async softDelete(vehicleId: string, tx?: PrismaTxClient): Promise<Vehicle> {
    const client = tx ?? this.prisma;
    return client.vehicle.update({
      where: { id: vehicleId },
      data: { deletedAt: new Date(), status: 'DELETED' },
    });
  }
}
