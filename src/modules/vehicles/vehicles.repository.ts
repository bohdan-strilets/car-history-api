import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
      data: input as Prisma.VehicleUncheckedCreateInput,
      include: { owner: { select: vehicleUserInfoSelect } },
    }) as unknown as Promise<VehicleWithOwner>;
  }

  async update(
    vehicleId: string,
    data: UpdateVehicleInput,
    tx?: PrismaTxClient,
  ): Promise<VehicleWithOwner> {
    const client = tx ?? this.prisma;
    return client.vehicle.update({
      where: { id: vehicleId },
      data: data as Prisma.VehicleUpdateInput,
      include: { owner: { select: vehicleUserInfoSelect } },
    }) as Promise<VehicleWithOwner>;
  }

  async softDelete(vehicleId: string, tx?: PrismaTxClient): Promise<VehicleWithOwner> {
    const client = tx ?? this.prisma;
    return client.vehicle.update({
      where: { id: vehicleId },
      data: { deletedAt: new Date(), status: 'DELETED' },
      include: { owner: { select: vehicleUserInfoSelect } },
    });
  }

  async softDeleteAllByWorkspaceId(workspaceId: string, tx?: PrismaTxClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.vehicle.updateMany({
      where: { workspaceId, deletedAt: null },
      data: { deletedAt: new Date(), status: 'DELETED' },
    });
  }
}
