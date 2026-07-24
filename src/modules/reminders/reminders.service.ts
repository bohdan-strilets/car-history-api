import { ErrorCodes, ForbiddenException, NotFoundException } from '@common/exceptions';
import { assertCanDeleteOwnedResource } from '@common/utils';
import { Injectable } from '@nestjs/common';
import {
  DocumentType,
  MaintenanceInterval,
  Prisma,
  Reminder,
  ReminderStatus,
  ReminderType,
  Role,
} from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { CreateReminderDto, ReminderResponseDto, UpdateReminderDto } from './dto';
import { toReminderResponse } from './mappers';
import { RemindersRepository } from './reminders.repository';
import { CreateReminderInput } from './types';

@Injectable()
export class RemindersService {
  constructor(private readonly remindersRepo: RemindersRepository) {}

  // ─── Queries ──────────────────────────────────────────────────────────────

  async getAllByVehicleId(vehicleId: string): Promise<ReminderResponseDto[]> {
    const reminders = await this.remindersRepo.findAllByVehicleId(vehicleId);
    return this.attachMaintenanceProgress(vehicleId, reminders);
  }

  async getById(id: string): Promise<Reminder> {
    const reminder = await this.remindersRepo.findById(id);
    if (!reminder) throw new NotFoundException(ErrorCodes.Reminder.NOT_FOUND);
    return reminder;
  }

  async getActiveByVehicleIds(vehicleIds: string[]): Promise<ReminderResponseDto[]> {
    const reminders = await this.remindersRepo.findActiveByVehicleIds(vehicleIds);
    return reminders.map(toReminderResponse);
  }

  async getActiveCountByVehicleIds(vehicleIds: string[]): Promise<Map<string, number>> {
    return this.remindersRepo.countActiveByVehicleIds(vehicleIds);
  }

  // ─── Commands (manual) ────────────────────────────────────────────────────

  async create(
    vehicleId: string,
    dto: CreateReminderDto,
    userId: string,
  ): Promise<ReminderResponseDto> {
    const reminder = await this.remindersRepo.create({
      vehicleId,
      createdBy: userId,
      type: dto.type,
      title: dto.title,
      description: dto.description ?? null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      dueMileage: dto.dueMileage ?? null,
    });

    return toReminderResponse(reminder);
  }

  async update(
    vehicleId: string,
    id: string,
    dto: UpdateReminderDto,
  ): Promise<ReminderResponseDto> {
    const reminder = await this.getById(id);

    if (reminder.vehicleId !== vehicleId) {
      throw new ForbiddenException(ErrorCodes.Reminder.NOT_FOUND);
    }

    const updated = await this.remindersRepo.update(id, {
      type: dto.type,
      title: dto.title,
      description: dto.description ?? null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      dueMileage: dto.dueMileage ?? undefined,
    });

    return toReminderResponse(updated);
  }

  async complete(vehicleId: string, id: string): Promise<ReminderResponseDto> {
    const reminder = await this.getById(id);

    if (reminder.vehicleId !== vehicleId) {
      throw new ForbiddenException(ErrorCodes.Reminder.NOT_FOUND);
    }

    if (reminder.status === ReminderStatus.COMPLETED) {
      throw new ForbiddenException(ErrorCodes.Reminder.ALREADY_COMPLETED);
    }

    const updated = await this.remindersRepo.update(id, {
      status: ReminderStatus.COMPLETED,
      completedAt: new Date(),
    });

    return toReminderResponse(updated);
  }

  async dismiss(vehicleId: string, id: string): Promise<ReminderResponseDto> {
    const reminder = await this.getById(id);

    if (reminder.vehicleId !== vehicleId) {
      throw new ForbiddenException(ErrorCodes.Reminder.NOT_FOUND);
    }

    if (reminder.status === ReminderStatus.DISMISSED) {
      throw new ForbiddenException(ErrorCodes.Reminder.ALREADY_DISMISSED);
    }

    const updated = await this.remindersRepo.update(id, {
      status: ReminderStatus.DISMISSED,
    });

    return toReminderResponse(updated);
  }

  async delete(vehicleId: string, id: string, memberRole: Role, userId: string): Promise<void> {
    const reminder = await this.getById(id);

    if (reminder.vehicleId !== vehicleId) {
      throw new ForbiddenException(ErrorCodes.Reminder.NOT_FOUND);
    }

    assertCanDeleteOwnedResource({
      memberRole,
      resourceCreatedBy: reminder.createdBy,
      userId,
    });

    await this.remindersRepo.delete(id);
  }

  // ─── Sync from MaintenanceInterval ────────────────────────────────────────

  async syncFromMaintenanceInterval(
    interval: MaintenanceInterval,
    tx?: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
  ): Promise<void> {
    const existing = await this.remindersRepo.findByMaintenanceIntervalId(interval.id, tx);

    if (interval.status === 'DISABLED') {
      if (existing) {
        await this.remindersRepo.update(existing.id, { status: ReminderStatus.DISMISSED }, tx);
      }
      return;
    }

    const data: CreateReminderInput = {
      vehicleId: interval.vehicleId,
      maintenanceIntervalId: interval.id,
      type: this.mapMaintenanceTypeToReminderType(interval.type),
      title: interval.title,
      dueDate: interval.nextServiceDate ?? null,
      dueMileage: interval.nextServiceMileage ?? null,
      status: ReminderStatus.ACTIVE,
    };

    if (existing) {
      await this.remindersRepo.update(
        existing.id,
        {
          title: data.title,
          dueDate: data.dueDate,
          dueMileage: data.dueMileage,
          status: ReminderStatus.ACTIVE,
        },
        tx,
      );
    } else {
      await this.remindersRepo.create(data, tx);
    }
  }

  async deleteByMaintenanceIntervalId(
    maintenanceIntervalId: string,
    tx?: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
  ): Promise<void> {
    await this.remindersRepo.deleteByMaintenanceIntervalId(maintenanceIntervalId, tx);
  }

  // ─── Sync from Document ───────────────────────────────────────────────────

  async syncFromDocument(params: {
    vehicleId: string;
    documentId: string;
    documentType: DocumentType;
    expireDate: Date | null;
    title: string;
    tx?: Parameters<Parameters<PrismaService['$transaction']>[0]>[0];
  }): Promise<void> {
    const { vehicleId, documentId, documentType, expireDate, title, tx } = params;

    const reminderType = this.mapDocumentTypeToReminderType(documentType);
    if (!reminderType) return;

    const existing = await this.remindersRepo.findByDocumentId(documentId, tx);

    if (!expireDate) {
      if (existing) await this.remindersRepo.delete(existing.id, tx);
      return;
    }

    if (existing) {
      await this.remindersRepo.update(
        existing.id,
        { title, dueDate: expireDate, status: ReminderStatus.ACTIVE },
        tx,
      );
    } else {
      await this.remindersRepo.create(
        { vehicleId, documentId, type: reminderType, title, dueDate: expireDate },
        tx,
      );
    }
  }

  async deleteByDocumentId(documentId: string, tx?: Prisma.TransactionClient): Promise<void> {
    await this.remindersRepo.deleteByDocumentId(documentId, tx);
  }

  async deleteAllByVehicleId(vehicleId: string, tx?: Prisma.TransactionClient): Promise<void> {
    await this.remindersRepo.deleteAllByVehicleId(vehicleId, tx);
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private mapDocumentTypeToReminderType(documentType: DocumentType): ReminderType | null {
    const map: Partial<Record<DocumentType, ReminderType>> = {
      [DocumentType.INSURANCE_OC]: ReminderType.INSURANCE,
      [DocumentType.INSURANCE_AC]: ReminderType.INSURANCE,
      [DocumentType.TECHNICAL_INSPECTION]: ReminderType.TECHNICAL_INSPECTION,
    };
    return map[documentType] ?? null;
  }

  private mapMaintenanceTypeToReminderType(maintenanceType: string): ReminderType {
    const map: Record<string, ReminderType> = {
      OIL_CHANGE: ReminderType.OIL_CHANGE,
      BRAKE_PADS: ReminderType.CUSTOM,
      BRAKE_DISCS: ReminderType.CUSTOM,
      TIMING_BELT: ReminderType.CUSTOM,
      AIR_FILTER: ReminderType.FILTER_CHANGE,
      FUEL_FILTER: ReminderType.FILTER_CHANGE,
      CABIN_FILTER: ReminderType.FILTER_CHANGE,
      SPARK_PLUGS: ReminderType.CUSTOM,
      COOLANT: ReminderType.CUSTOM,
      TRANSMISSION_OIL: ReminderType.OIL_CHANGE,
      CUSTOM: ReminderType.CUSTOM,
    };
    return map[maintenanceType] ?? ReminderType.CUSTOM;
  }

  private async attachMaintenanceProgress(
    vehicleId: string,
    reminders: Reminder[],
  ): Promise<ReminderResponseDto[]> {
    const intervalIds = [
      ...new Set(
        reminders.map((r) => r.maintenanceIntervalId).filter((id): id is string => id !== null),
      ),
    ];

    if (intervalIds.length === 0) {
      return reminders.map((reminder) => toReminderResponse(reminder));
    }

    const [intervalsById, currentMileage] = await Promise.all([
      this.remindersRepo.findMaintenanceIntervalsByIds(intervalIds),
      this.remindersRepo.getVehicleCurrentMileage(vehicleId),
    ]);

    return reminders.map((reminder) => {
      const interval = reminder.maintenanceIntervalId
        ? intervalsById.get(reminder.maintenanceIntervalId)
        : undefined;

      const progress = interval
        ? this.calculateMaintenanceProgress(interval, currentMileage)
        : null;

      return toReminderResponse(reminder, progress);
    });
  }

  private calculateMaintenanceProgress(
    interval: {
      lastServiceMileage: number | null;
      lastServiceDate: Date | null;
      intervalKm: number | null;
      intervalMonths: number | null;
    },
    currentMileage: number,
  ): number | null {
    const percentages: number[] = [];

    if (interval.intervalKm != null && interval.lastServiceMileage != null) {
      percentages.push(
        ((currentMileage - interval.lastServiceMileage) / interval.intervalKm) * 100,
      );
    }

    if (interval.intervalMonths != null && interval.lastServiceDate != null) {
      const totalDays = interval.intervalMonths * 30;
      const daysPassed = (Date.now() - interval.lastServiceDate.getTime()) / (1000 * 60 * 60 * 24);
      percentages.push((daysPassed / totalDays) * 100);
    }

    if (percentages.length === 0) {
      return null;
    }

    return Math.min(Math.max(Math.round(Math.max(...percentages)), 0), 100);
  }
}
