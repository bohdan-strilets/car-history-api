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
}
