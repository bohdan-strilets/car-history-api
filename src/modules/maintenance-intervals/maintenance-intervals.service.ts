import { ErrorCodes, ForbiddenException, NotFoundException } from '@common/exceptions';
import { RemindersService } from '@modules/reminders';
import { TimelineService } from '@modules/timeline';
import { Injectable } from '@nestjs/common';
import { MaintenanceInterval, MaintenanceStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import {
  CreateMaintenanceIntervalDto,
  MaintenanceIntervalResponseDto,
  UpdateMaintenanceIntervalDto,
} from './dto';
import { MaintenanceIntervalsRepository } from './maintenance-intervals.repository';
import { toMaintenanceIntervalResponse } from './mappers';

@Injectable()
export class MaintenanceIntervalsService {
  constructor(
    private readonly maintenanceIntervalsRepo: MaintenanceIntervalsRepository,
    private readonly remindersService: RemindersService,
    private readonly timelineService: TimelineService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Queries ──────────────────────────────────────────────────────────────

  async getAllByVehicleId(vehicleId: string): Promise<MaintenanceIntervalResponseDto[]> {
    const intervals = await this.maintenanceIntervalsRepo.findAllByVehicleId(vehicleId);
    return intervals.map(toMaintenanceIntervalResponse);
  }

  async getById(id: string): Promise<MaintenanceInterval> {
    const interval = await this.maintenanceIntervalsRepo.findById(id);
    if (!interval) throw new NotFoundException(ErrorCodes.Maintenance.NOT_FOUND);
    return interval;
  }

  // ─── Commands ─────────────────────────────────────────────────────────────

  async create(
    workspaceId: string,
    vehicleId: string,
    dto: CreateMaintenanceIntervalDto,
  ): Promise<MaintenanceIntervalResponseDto> {
    await this.ensureVehicleBelongsToWorkspace(workspaceId, vehicleId);

    const { nextServiceMileage, nextServiceDate } = this.calculateNext({
      intervalKm: dto.intervalKm ?? null,
      intervalMonths: dto.intervalMonths ?? null,
      lastServiceMileage: dto.lastServiceMileage ?? null,
      lastServiceDate: dto.lastServiceDate ? new Date(dto.lastServiceDate) : null,
    });

    const interval = await this.prisma.$transaction(async (tx) => {
      const created = await this.maintenanceIntervalsRepo.create(
        {
          vehicleId,
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

    return toMaintenanceIntervalResponse(interval);
  }

  async update(
    workspaceId: string,
    vehicleId: string,
    id: string,
    dto: UpdateMaintenanceIntervalDto,
  ): Promise<MaintenanceIntervalResponseDto> {
    await this.ensureVehicleBelongsToWorkspace(workspaceId, vehicleId);
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
      const result = await this.maintenanceIntervalsRepo.update(
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

    return toMaintenanceIntervalResponse(updated);
  }

  async disable(
    workspaceId: string,
    vehicleId: string,
    id: string,
  ): Promise<MaintenanceIntervalResponseDto> {
    await this.ensureVehicleBelongsToWorkspace(workspaceId, vehicleId);
    const interval = await this.getById(id);

    if (interval.vehicleId !== vehicleId) {
      throw new ForbiddenException(ErrorCodes.Vehicle.ACCESS_DENIED);
    }

    if (interval.status === MaintenanceStatus.DISABLED) {
      throw new ForbiddenException(ErrorCodes.Maintenance.ALREADY_DISABLED);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await this.maintenanceIntervalsRepo.update(
        id,
        { status: MaintenanceStatus.DISABLED },
        tx,
      );

      await this.remindersService.syncFromMaintenanceInterval(result, tx);
      return result;
    });

    return toMaintenanceIntervalResponse(updated);
  }

  async enable(
    workspaceId: string,
    vehicleId: string,
    id: string,
  ): Promise<MaintenanceIntervalResponseDto> {
    await this.ensureVehicleBelongsToWorkspace(workspaceId, vehicleId);
    const interval = await this.getById(id);

    if (interval.vehicleId !== vehicleId) {
      throw new ForbiddenException(ErrorCodes.Vehicle.ACCESS_DENIED);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await this.maintenanceIntervalsRepo.update(
        id,
        { status: MaintenanceStatus.ACTIVE },
        tx,
      );

      await this.remindersService.syncFromMaintenanceInterval(result, tx);
      return result;
    });

    return toMaintenanceIntervalResponse(updated);
  }

  async delete(workspaceId: string, vehicleId: string, id: string): Promise<void> {
    await this.ensureVehicleBelongsToWorkspace(workspaceId, vehicleId);
    const interval = await this.getById(id);

    if (interval.vehicleId !== vehicleId) {
      throw new ForbiddenException(ErrorCodes.Vehicle.ACCESS_DENIED);
    }

    await this.prisma.$transaction(async (tx) => {
      await this.remindersService.deleteByMaintenanceIntervalId(id, tx);
      await this.maintenanceIntervalsRepo.delete(id, tx);
    });
  }

  async markAsDone(
    workspaceId: string,
    vehicleId: string,
    id: string,
    dto: { mileage: number; date: Date },
  ): Promise<MaintenanceIntervalResponseDto> {
    await this.ensureVehicleBelongsToWorkspace(workspaceId, vehicleId);
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
      const result = await this.maintenanceIntervalsRepo.update(
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

    return toMaintenanceIntervalResponse(updated);
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private async ensureVehicleBelongsToWorkspace(
    workspaceId: string,
    vehicleId: string,
  ): Promise<void> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId, deletedAt: null },
      select: { workspaceId: true },
    });

    if (!vehicle) throw new NotFoundException(ErrorCodes.Vehicle.NOT_FOUND);

    if (vehicle.workspaceId !== workspaceId) {
      throw new ForbiddenException(ErrorCodes.Vehicle.ACCESS_DENIED);
    }
  }

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
