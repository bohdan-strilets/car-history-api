import { Injectable } from '@nestjs/common';
import { Prisma, Reminder, ReminderStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { CreateReminderInput, UpdateReminderInput } from './types';

@Injectable()
export class RemindersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<Reminder | null> {
    const client = tx ?? this.prisma;
    return client.reminder.findUnique({ where: { id } });
  }

  async findAllByVehicleId(vehicleId: string): Promise<Reminder[]> {
    return this.prisma.reminder.findMany({
      where: { vehicleId },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findByMaintenanceIntervalId(
    maintenanceIntervalId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Reminder | null> {
    const client = tx ?? this.prisma;
    return client.reminder.findFirst({ where: { maintenanceIntervalId } });
  }

  async findByDocumentId(
    documentId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Reminder | null> {
    const client = tx ?? this.prisma;
    return client.reminder.findFirst({ where: { documentId } });
  }

  async findActiveForCron(): Promise<Reminder[]> {
    return this.prisma.reminder.findMany({
      where: { status: ReminderStatus.ACTIVE, dueDate: { not: null } },
    });
  }

  async findActiveByVehicleIds(vehicleIds: string[]): Promise<Reminder[]> {
    if (vehicleIds.length === 0) return [];

    return this.prisma.reminder.findMany({
      where: { vehicleId: { in: vehicleIds }, status: ReminderStatus.ACTIVE },
    });
  }

  async countActiveByVehicleIds(vehicleIds: string[]): Promise<Map<string, number>> {
    const result = new Map<string, number>(vehicleIds.map((id) => [id, 0]));

    if (vehicleIds.length === 0) {
      return result;
    }

    const grouped = await this.prisma.reminder.groupBy({
      by: ['vehicleId'],
      where: { vehicleId: { in: vehicleIds }, status: ReminderStatus.ACTIVE },
      _count: { id: true },
    });

    for (const row of grouped) {
      result.set(row.vehicleId, row._count.id);
    }

    return result;
  }

  async create(data: CreateReminderInput, tx?: Prisma.TransactionClient): Promise<Reminder> {
    const client = tx ?? this.prisma;
    return client.reminder.create({ data });
  }

  async update(
    id: string,
    data: UpdateReminderInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Reminder> {
    const client = tx ?? this.prisma;
    return client.reminder.update({ where: { id }, data });
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.reminder.delete({ where: { id } });
  }

  async deleteByMaintenanceIntervalId(
    maintenanceIntervalId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.reminder.deleteMany({ where: { maintenanceIntervalId } });
  }

  async deleteByDocumentId(documentId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.reminder.deleteMany({ where: { documentId } });
  }

  async deleteAllByVehicleId(vehicleId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.reminder.deleteMany({ where: { vehicleId } });
  }
}
