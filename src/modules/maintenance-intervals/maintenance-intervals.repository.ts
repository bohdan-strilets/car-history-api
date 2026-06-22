import { Injectable } from '@nestjs/common';
import { MaintenanceInterval, Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { CreateMaintenanceIntervalInput, UpdateMaintenanceIntervalInput } from './types';

@Injectable()
export class MaintenanceIntervalsRepository {
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
    data: CreateMaintenanceIntervalInput,
    tx?: Prisma.TransactionClient,
  ): Promise<MaintenanceInterval> {
    const client = tx ?? this.prisma;
    return client.maintenanceInterval.create({ data });
  }

  async update(
    id: string,
    data: UpdateMaintenanceIntervalInput,
    tx?: Prisma.TransactionClient,
  ): Promise<MaintenanceInterval> {
    const client = tx ?? this.prisma;
    return client.maintenanceInterval.update({ where: { id }, data });
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.maintenanceInterval.delete({ where: { id } });
  }
}
