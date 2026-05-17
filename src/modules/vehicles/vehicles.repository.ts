import { Injectable } from '@nestjs/common';
import { Vehicle } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { PrismaTxClient } from '@prisma/prisma.types';

import { CreateVehicleInput } from './types';

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
}
