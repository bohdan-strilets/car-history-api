import { ErrorCodes, ForbiddenException, NotFoundException } from '@common/exceptions';
import { Injectable } from '@nestjs/common';
import {
  DocumentType,
  MaintenanceInterval,
  Reminder,
  ReminderStatus,
  ReminderType,
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
    return reminders.map(toReminderResponse);
  }

  async getById(id: string): Promise<Reminder> {
    const reminder = await this.remindersRepo.findById(id);
    if (!reminder) throw new NotFoundException(ErrorCodes.Reminder.NOT_FOUND);
    return reminder;
  }

  // ─── Commands (manual) ────────────────────────────────────────────────────

  async create(vehicleId: string, dto: CreateReminderDto): Promise<ReminderResponseDto> {
    const reminder = await this.remindersRepo.create({
      vehicleId,
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

  async delete(vehicleId: string, id: string): Promise<void> {
    const reminder = await this.getById(id);

    if (reminder.vehicleId !== vehicleId) {
      throw new ForbiddenException(ErrorCodes.Reminder.NOT_FOUND);
    }

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

  async deleteByDocumentId(
    documentId: string,
    tx?: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
  ): Promise<void> {
    await this.remindersRepo.deleteByDocumentId(documentId, tx);
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
}
