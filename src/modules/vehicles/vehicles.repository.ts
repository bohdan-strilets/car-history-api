import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { PrismaTxClient } from '@prisma/prisma.types';

import { vehicleUserInfoSelect } from './selects';
import { CreateVehicleInput, UpdateVehicleInput, VehicleWithOwner } from './types';

@Injectable()
export class VehiclesRepo {
  constructor(private readonly prisma: PrismaService) {}

  async findById(vehicleId: string): Promise<VehicleWithOwner | null> {
    return this.prisma.vehicle.findUnique({
      where: { id: vehicleId, deletedAt: null },
      include: { owner: { select: vehicleUserInfoSelect } },
    });
  }

  async findAllByWorkspaceId(workspaceId: string): Promise<VehicleWithOwner[]> {
    return this.prisma.vehicle.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: vehicleUserInfoSelect } },
    });
  }

  async create(input: CreateVehicleInput, tx?: PrismaTxClient): Promise<VehicleWithOwner> {
    const client = tx ?? this.prisma;
    return client.vehicle.create({
      data: input,
      include: { owner: { select: vehicleUserInfoSelect } },
    });
  }

  async update(
    vehicleId: string,
    data: UpdateVehicleInput,
    tx?: PrismaTxClient,
  ): Promise<VehicleWithOwner> {
    const client = tx ?? this.prisma;
    return client.vehicle.update({
      where: { id: vehicleId },
      data,
      include: { owner: { select: vehicleUserInfoSelect } },
    });
  }

  async softDelete(vehicleId: string, tx?: PrismaTxClient): Promise<VehicleWithOwner> {
    const client = tx ?? this.prisma;
    return client.vehicle.update({
      where: { id: vehicleId },
      data: { deletedAt: new Date(), status: 'DELETED' },
      include: { owner: { select: vehicleUserInfoSelect } },
    });
  }
}
