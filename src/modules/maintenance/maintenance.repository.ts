import { Injectable } from '@nestjs/common';
import { MaintenanceInterval, Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { CreateMaintenanceInput, UpdateMaintenanceInput } from './types';

@Injectable()
export class MaintenanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<MaintenanceInterval | null> {
    const client = tx ?? this.prisma;
    return client.maintenanceInterval.findUnique({ where: { id } });
  }

  async findAllByVehicleId(vehicleId: string): Promise<MaintenanceInterval[]> {
    return this.prisma.maintenanceInterval.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(
    data: CreateMaintenanceInput,
    tx?: Prisma.TransactionClient,
  ): Promise<MaintenanceInterval> {
    const client = tx ?? this.prisma;
    return client.maintenanceInterval.create({ data });
  }

  async update(
    id: string,
    data: UpdateMaintenanceInput,
    tx?: Prisma.TransactionClient,
  ): Promise<MaintenanceInterval> {
    const client = tx ?? this.prisma;
    return client.maintenanceInterval.update({ where: { id }, data });
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.maintenanceInterval.delete({ where: { id } });
  }

  async deleteAllByVehicleId(vehicleId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.maintenanceInterval.deleteMany({ where: { vehicleId } });
  }
}
