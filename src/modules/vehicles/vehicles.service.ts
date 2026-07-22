import { ErrorCodes, ForbiddenException, NotFoundException } from '@common/exceptions';
import { AiService } from '@modules/ai';
import { MaintenanceService } from '@modules/maintenance';
import { MediaService } from '@modules/media';
import { MilestonesService } from '@modules/milestones';
import { RemindersService } from '@modules/reminders';
import { TimelineService } from '@modules/timeline';
import { TiresService } from '@modules/tires';
import { Injectable } from '@nestjs/common';
import { MaintenanceInterval } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { PrismaTxClient } from '@prisma/prisma.types';

import {
  CreateVehicleDto,
  UpdateVehicleDto,
  UpdateVehicleSpecsDto,
  VehicleResponseDto,
} from './dto';
import { toVehicleResponse } from './mappers';
import {
  InsuranceStatus,
  VehicleFuelConsumptionInfo,
  VehicleInsuranceInfo,
  VehicleNextMaintenanceInfo,
  VehicleSpecs,
  VehicleWithOwner,
} from './types';
import { VehiclesRepo } from './vehicles.repository';

const INSURANCE_EXPIRING_THRESHOLD_DAYS = 30;
const AVG_KM_PER_MONTH = 1500;

@Injectable()
export class VehiclesService {
  constructor(
    private readonly vehiclesRepo: VehiclesRepo,
    private readonly aiService: AiService,
    private readonly timelineService: TimelineService,
    private readonly remindersService: RemindersService,
    private readonly maintenanceService: MaintenanceService,
    private readonly tiresService: TiresService,
    private readonly milestonesService: MilestonesService,
    private readonly mediaService: MediaService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Queries ──────────────────────────────────────────────────────────────

  async getById(vehicleId: string): Promise<VehicleWithOwner> {
    const vehicle = await this.vehiclesRepo.findById(vehicleId);
    if (!vehicle) throw new NotFoundException(ErrorCodes.Vehicle.NOT_FOUND);
    return vehicle;
  }

  async getAllByWorkspaceId(workspaceId: string): Promise<VehicleResponseDto[]> {
    const vehicles = await this.vehiclesRepo.findAllByWorkspaceId(workspaceId);
    return this.buildVehicleResponses(vehicles);
  }

  async getByIdWithSummary(vehicleId: string): Promise<VehicleResponseDto> {
    const vehicle = await this.getById(vehicleId);
    const [response] = await this.buildVehicleResponses([vehicle]);
    return response;
  }

  // ─── Commands ─────────────────────────────────────────────────────────────

  async create(
    userId: string,
    workspaceId: string,
    dto: CreateVehicleDto,
  ): Promise<VehicleResponseDto> {
    const mileage = dto.currentMileage ?? 0;

    const vehicle = await this.vehiclesRepo.create({
      ownerId: userId,
      workspaceId,
      ...dto,
      currentMileage: mileage,
      registrationMileage: mileage,
    });

    return toVehicleResponse(vehicle);
  }

  async update(
    workspaceId: string,
    vehicleId: string,
    dto: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.getById(vehicleId);

    if (vehicle.workspaceId !== workspaceId) {
      throw new ForbiddenException(ErrorCodes.Vehicle.ACCESS_DENIED);
    }

    const updated = await this.vehiclesRepo.update(vehicleId, dto);
    return toVehicleResponse(updated);
  }

  async updateSpecs(
    workspaceId: string,
    vehicleId: string,
    dto: UpdateVehicleSpecsDto,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.getById(vehicleId);

    if (vehicle.workspaceId !== workspaceId) {
      throw new ForbiddenException(ErrorCodes.Vehicle.ACCESS_DENIED);
    }

    const updated = await this.vehiclesRepo.update(vehicleId, {
      specs: dto as VehicleSpecs,
    });

    return toVehicleResponse(updated);
  }

  async delete(workspaceId: string, vehicleId: string): Promise<void> {
    const vehicle = await this.getById(vehicleId);

    if (vehicle.workspaceId !== workspaceId) {
      throw new ForbiddenException(ErrorCodes.Vehicle.ACCESS_DENIED);
    }

    await this.prisma.$transaction(async (tx) => {
      await this.remindersService.deleteAllByVehicleId(vehicleId, tx);
      await this.maintenanceService.deleteAllByVehicleId(vehicleId, tx);
      await this.tiresService.deleteAllByVehicleId(vehicleId, tx);
      await this.timelineService.softDeleteAllByVehicleId(vehicleId, tx);
      await this.timelineService.deleteAllMileageLogsByVehicleId(vehicleId, tx);
      await this.milestonesService.deleteAllByVehicleId(vehicleId, tx);
      await this.vehiclesRepo.softDelete(vehicleId, tx);
    });
  }

  async softDeleteAllByWorkspaceId(workspaceId: string, tx?: PrismaTxClient): Promise<void> {
    await this.vehiclesRepo.softDeleteAllByWorkspaceId(workspaceId, tx);
  }

  async fillSpecsWithAi(workspaceId: string, vehicleId: string): Promise<VehicleResponseDto> {
    const vehicle = await this.getById(vehicleId);

    if (vehicle.workspaceId !== workspaceId) {
      throw new ForbiddenException(ErrorCodes.Vehicle.ACCESS_DENIED);
    }

    const specs = await this.aiService.fillVehicleSpecs({
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      generation: vehicle.generation,
      engineDisplacementCc: vehicle.engineDisplacementCc,
      fuelType: vehicle.fuelType,
    });

    const updated = await this.vehiclesRepo.update(vehicleId, {
      specs: specs as VehicleSpecs,
    });

    return toVehicleResponse(updated);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private buildInsuranceInfo(expireDate: Date | null): VehicleInsuranceInfo {
    if (!expireDate) {
      return { status: 'MISSING', expireDate: null };
    }

    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    let status: InsuranceStatus;
    if (daysUntilExpiry < 0) {
      status = 'EXPIRED';
    } else if (daysUntilExpiry <= INSURANCE_EXPIRING_THRESHOLD_DAYS) {
      status = 'EXPIRING';
    } else {
      status = 'ACTIVE';
    }

    return { status, expireDate: expireDate.toISOString() };
  }

  private pickNearestMaintenance(
    intervals: MaintenanceInterval[],
    currentMileage: number,
  ): VehicleNextMaintenanceInfo | null {
    if (intervals.length === 0) {
      return null;
    }

    const now = new Date();

    const scored = intervals.map((interval) => {
      const monthsUntilDate = interval.nextServiceDate
        ? (interval.nextServiceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
        : null;

      const monthsUntilMileage = interval.nextServiceMileage
        ? (interval.nextServiceMileage - currentMileage) / AVG_KM_PER_MONTH
        : null;

      const candidates = [monthsUntilDate, monthsUntilMileage].filter(
        (v): v is number => v !== null,
      );
      const score = candidates.length > 0 ? Math.min(...candidates) : Infinity;

      return { interval, score };
    });

    scored.sort((a, b) => a.score - b.score);
    const nearest = scored[0].interval;

    return {
      type: nearest.type,
      dueDate: nearest.nextServiceDate?.toISOString() ?? null,
      dueMileage: nearest.nextServiceMileage ?? null,
    };
  }

  private calculateFuelConsumption(
    refuels: Array<{ mileage: number; liters: number }>,
    specsCombinedConsumption: number | undefined,
  ): VehicleFuelConsumptionInfo {
    // refuels are ordered newest-first; need at least 2 points to get one delta
    if (refuels.length >= 2) {
      const [newer, older] = refuels;
      const kmDriven = newer.mileage - older.mileage;

      if (kmDriven > 0) {
        const litersUsed = newer.liters;
        const value = Math.round((litersUsed / kmDriven) * 100 * 10) / 10;
        return { value, source: 'CALCULATED' };
      }
    }

    if (specsCombinedConsumption != null) {
      return { value: specsCombinedConsumption, source: 'SPEC' };
    }

    return { value: null, source: null };
  }

  private async buildVehicleResponses(vehicles: VehicleWithOwner[]): Promise<VehicleResponseDto[]> {
    const vehicleIds = vehicles.map((v) => v.id);

    const [
      photoUrlsByVehicleId,
      monthlyExpensesByVehicleId,
      insuranceExpireDatesByVehicleId,
      tireSeasonByVehicleId,
      activeRemindersCountByVehicleId,
      maintenanceByVehicleId,
      latestMilestoneByVehicleId,
      recentRefuelsByVehicleId,
    ] = await Promise.all([
      this.mediaService.getPrimaryPhotoUrlsByVehicleIds(vehicleIds),
      this.timelineService.getMonthlyExpensesByVehicleIds(vehicleIds),
      this.timelineService.getLatestInsuranceExpireDatesByVehicleIds(vehicleIds),
      this.tiresService.getMountedTireTypesByVehicleIds(vehicleIds),
      this.remindersService.getActiveCountByVehicleIds(vehicleIds),
      this.maintenanceService.getActiveByVehicleIds(vehicleIds),
      this.milestonesService.getLatestByVehicleIds(vehicleIds),
      this.timelineService.getRecentFullTankRefuelsByVehicleIds(vehicleIds),
    ]);

    return vehicles.map((vehicle) =>
      toVehicleResponse(
        vehicle,
        photoUrlsByVehicleId.get(vehicle.id) ?? null,
        monthlyExpensesByVehicleId.get(vehicle.id) ?? 0,
        this.buildInsuranceInfo(insuranceExpireDatesByVehicleId.get(vehicle.id) ?? null),
        tireSeasonByVehicleId.get(vehicle.id) ?? null,
        activeRemindersCountByVehicleId.get(vehicle.id) ?? 0,
        this.pickNearestMaintenance(
          maintenanceByVehicleId.get(vehicle.id) ?? [],
          vehicle.currentMileage,
        ),
        latestMilestoneByVehicleId.get(vehicle.id) ?? null,
        this.calculateFuelConsumption(
          recentRefuelsByVehicleId.get(vehicle.id) ?? [],
          (vehicle.specs as VehicleSpecs | null)?.combinedConsumption,
        ),
      ),
    );
  }
}
