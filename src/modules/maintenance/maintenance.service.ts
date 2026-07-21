import { ErrorCodes, ForbiddenException, NotFoundException } from '@common/exceptions';
import { assertCanDeleteOwnedResource } from '@common/utils';
import { RemindersService } from '@modules/reminders';
import { TimelineService } from '@modules/timeline';
import { Injectable } from '@nestjs/common';
import { MaintenanceInterval, MaintenanceStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { CreateMaintenanceDto, MaintenanceResponseDto, UpdateMaintenanceDto } from './dto';
import { MaintenanceRepository } from './maintenance.repository';
import { toMaintenanceResponse } from './mappers';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly maintenanceRepo: MaintenanceRepository,
    private readonly remindersService: RemindersService,
    private readonly timelineService: TimelineService,
    private readonly prisma: PrismaService, // used only for $transaction
  ) {}

  // ─── Queries ──────────────────────────────────────────────────────────────

  async getAllByVehicleId(vehicleId: string): Promise<MaintenanceResponseDto[]> {
    const intervals = await this.maintenanceRepo.findAllByVehicleId(vehicleId);
    return intervals.map(toMaintenanceResponse);
  }

  async getById(id: string): Promise<MaintenanceInterval> {
    const interval = await this.maintenanceRepo.findById(id);
    if (!interval) throw new NotFoundException(ErrorCodes.Maintenance.NOT_FOUND);
    return interval;
  }

  async getActiveByVehicleIds(vehicleIds: string[]): Promise<Map<string, MaintenanceInterval[]>> {
    const result = new Map<string, MaintenanceInterval[]>(vehicleIds.map((id) => [id, []]));

    const intervals = await this.maintenanceRepo.findActiveByVehicleIds(vehicleIds);

    for (const interval of intervals) {
      const existing = result.get(interval.vehicleId) ?? [];
      existing.push(interval);
      result.set(interval.vehicleId, existing);
    }

    return result;
  }

  // ─── Commands ─────────────────────────────────────────────────────────────

  async create(
    vehicleId: string,
    dto: CreateMaintenanceDto,
    userId: string,
  ): Promise<MaintenanceResponseDto> {
    const { nextServiceMileage, nextServiceDate } = this.calculateNext({
      intervalKm: dto.intervalKm ?? null,
      intervalMonths: dto.intervalMonths ?? null,
      lastServiceMileage: dto.lastServiceMileage ?? null,
      lastServiceDate: dto.lastServiceDate ? new Date(dto.lastServiceDate) : null,
    });

    const interval = await this.prisma.$transaction(async (tx) => {
      const created = await this.maintenanceRepo.create(
        {
          vehicleId,
          createdBy: userId,
          type: dto.type,
          title: dto.title,
          intervalKm: dto.intervalKm ?? null,
          intervalMonths: dto.intervalMonths ?? null,
          lastServiceMileage: dto.lastServiceMileage ?? null,
          lastServiceDate: dto.lastServiceDate ? new Date(dto.lastServiceDate) : null,
          nextServiceMileage,
          nextServiceDate,
        },
        tx,
      );

      await this.remindersService.syncFromMaintenanceInterval(created, tx);
      return created;
    });

    return toMaintenanceResponse(interval);
  }

  async update(
    vehicleId: string,
    id: string,
    dto: UpdateMaintenanceDto,
  ): Promise<MaintenanceResponseDto> {
    const interval = await this.getById(id);

    if (interval.vehicleId !== vehicleId) {
      throw new ForbiddenException(ErrorCodes.Vehicle.ACCESS_DENIED);
    }

    const merged = {
      intervalKm: dto.intervalKm ?? interval.intervalKm,
      intervalMonths: dto.intervalMonths ?? interval.intervalMonths,
      lastServiceMileage: dto.lastServiceMileage ?? interval.lastServiceMileage,
      lastServiceDate: dto.lastServiceDate
        ? new Date(dto.lastServiceDate)
        : interval.lastServiceDate,
    };

    const { nextServiceMileage, nextServiceDate } = this.calculateNext(merged);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await this.maintenanceRepo.update(
        id,
        {
          type: dto.type,
          title: dto.title,
          intervalKm: merged.intervalKm,
          intervalMonths: merged.intervalMonths,
          lastServiceMileage: merged.lastServiceMileage,
          lastServiceDate: merged.lastServiceDate,
          nextServiceMileage,
          nextServiceDate,
        },
        tx,
      );

      await this.remindersService.syncFromMaintenanceInterval(result, tx);
      return result;
    });

    return toMaintenanceResponse(updated);
  }

  async disable(vehicleId: string, id: string): Promise<MaintenanceResponseDto> {
    const interval = await this.getById(id);

    if (interval.vehicleId !== vehicleId) {
      throw new ForbiddenException(ErrorCodes.Vehicle.ACCESS_DENIED);
    }

    if (interval.status === MaintenanceStatus.DISABLED) {
      throw new ForbiddenException(ErrorCodes.Maintenance.ALREADY_DISABLED);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await this.maintenanceRepo.update(
        id,
        { status: MaintenanceStatus.DISABLED },
        tx,
      );

      await this.remindersService.syncFromMaintenanceInterval(result, tx);
      return result;
    });

    return toMaintenanceResponse(updated);
  }

  async enable(vehicleId: string, id: string): Promise<MaintenanceResponseDto> {
    const interval = await this.getById(id);

    if (interval.vehicleId !== vehicleId) {
      throw new ForbiddenException(ErrorCodes.Vehicle.ACCESS_DENIED);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await this.maintenanceRepo.update(
        id,
        { status: MaintenanceStatus.ACTIVE },
        tx,
      );

      await this.remindersService.syncFromMaintenanceInterval(result, tx);
      return result;
    });

    return toMaintenanceResponse(updated);
  }

  async delete(vehicleId: string, id: string, memberRole: Role, userId: string): Promise<void> {
    const interval = await this.getById(id);

    if (interval.vehicleId !== vehicleId) {
      throw new ForbiddenException(ErrorCodes.Vehicle.ACCESS_DENIED);
    }

    assertCanDeleteOwnedResource({
      memberRole,
      resourceCreatedBy: interval.createdBy,
      userId,
    });

    await this.prisma.$transaction(async (tx) => {
      await this.remindersService.deleteByMaintenanceIntervalId(id, tx);
      await this.maintenanceRepo.delete(id, tx);
    });
  }

  async markAsDone(
    vehicleId: string,
    id: string,
    dto: { mileage: number; date: Date },
  ): Promise<MaintenanceResponseDto> {
    const interval = await this.getById(id);

    if (interval.vehicleId !== vehicleId) {
      throw new ForbiddenException(ErrorCodes.Vehicle.ACCESS_DENIED);
    }

    const { nextServiceMileage, nextServiceDate } = this.calculateNext({
      intervalKm: interval.intervalKm,
      intervalMonths: interval.intervalMonths,
      lastServiceMileage: dto.mileage,
      lastServiceDate: dto.date,
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await this.maintenanceRepo.update(
        id,
        {
          lastServiceMileage: dto.mileage,
          lastServiceDate: dto.date,
          nextServiceMileage,
          nextServiceDate,
          status: MaintenanceStatus.ACTIVE,
        },
        tx,
      );

      await this.timelineService.createMaintenanceServiceEvent(
        {
          vehicleId,
          maintenanceIntervalId: id,
          title: interval.title,
          mileage: dto.mileage,
          eventDate: dto.date,
        },
        tx,
      );

      await this.remindersService.syncFromMaintenanceInterval(result, tx);
      return result;
    });

    return toMaintenanceResponse(updated);
  }

  async deleteAllByVehicleId(vehicleId: string, tx?: Prisma.TransactionClient): Promise<void> {
    await this.maintenanceRepo.deleteAllByVehicleId(vehicleId, tx);
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private calculateNext(data: {
    intervalKm?: number | null;
    intervalMonths?: number | null;
    lastServiceMileage?: number | null;
    lastServiceDate?: Date | null;
  }): { nextServiceMileage: number | null; nextServiceDate: Date | null } {
    const nextServiceMileage =
      data.intervalKm != null && data.lastServiceMileage != null
        ? data.lastServiceMileage + data.intervalKm
        : null;

    let nextServiceDate: Date | null = null;
    if (data.intervalMonths != null && data.lastServiceDate != null) {
      nextServiceDate = new Date(data.lastServiceDate);
      nextServiceDate.setMonth(nextServiceDate.getMonth() + data.intervalMonths);
    }

    return { nextServiceMileage, nextServiceDate };
  }
}
