import { ErrorCodes, ForbiddenException, NotFoundException } from '@common/exceptions';
import { Injectable } from '@nestjs/common';
import { Prisma, Tire, TireChangeType, TireStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { CreateTireDto, TireResponseDto, UpdateTireDto } from './dto';
import { toTireResponse } from './mappers';
import { TiresRepository } from './tires.repository';
import { TireHistory, TirePeriod } from './types';

@Injectable()
export class TiresService {
  constructor(
    private readonly tiresRepo: TiresRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Queries ──────────────────────────────────────────────────────────────

  async getAllByVehicleId(vehicleId: string): Promise<TireResponseDto[]> {
    const tires = await this.tiresRepo.findAllByVehicleId(vehicleId);
    return tires.map(toTireResponse);
  }

  async getById(id: string): Promise<Tire> {
    const tire = await this.tiresRepo.findById(id);
    if (!tire) throw new NotFoundException(ErrorCodes.Tire.NOT_FOUND);
    return tire;
  }

  // ─── Commands ─────────────────────────────────────────────────────────────

  async create(vehicleId: string, dto: CreateTireDto): Promise<TireResponseDto> {
    const tire = await this.tiresRepo.create({
      vehicleId,
      brand: dto.brand,
      model: dto.model,
      type: dto.type,
      width: dto.width,
      aspectRatio: dto.aspectRatio,
      rimDiameter: dto.rimDiameter,
      price: dto.price ?? null,
      status: TireStatus.STORED,
      storageLocation: dto.storageLocation ?? null,
      mileageAtPurchase: dto.mileageAtPurchase ?? null,
      quantity: dto.quantity ?? 4,
      purchaseAt: dto.purchaseAt ? new Date(dto.purchaseAt) : null,
    });

    return toTireResponse(tire);
  }

  async update(userId: string, id: string, dto: UpdateTireDto): Promise<TireResponseDto> {
    const tire = await this.getById(id);
    await this.assertWorkspaceAccess(userId, tire.vehicleId);

    if (dto.status === TireStatus.MOUNTED && tire.status === TireStatus.MOUNTED) {
      throw new ForbiddenException(ErrorCodes.Tire.ALREADY_MOUNTED);
    }

    if (dto.status === TireStatus.RETIRED && tire.status === TireStatus.RETIRED) {
      throw new ForbiddenException(ErrorCodes.Tire.ALREADY_RETIRED);
    }

    if (dto.status === TireStatus.MOUNTED) {
      return this.manualMount(tire, dto);
    }

    const updated = await this.tiresRepo.update(id, {
      brand: dto.brand,
      model: dto.model,
      type: dto.type,
      width: dto.width,
      aspectRatio: dto.aspectRatio,
      rimDiameter: dto.rimDiameter,
      price: dto.price,
      storageLocation: dto.storageLocation,
      mileageAtPurchase: dto.mileageAtPurchase,
      quantity: dto.quantity,
      purchaseAt: dto.purchaseAt ? new Date(dto.purchaseAt) : undefined,
      status: dto.status,
    });

    return toTireResponse(updated);
  }

  async delete(userId: string, id: string): Promise<void> {
    const tire = await this.getById(id);
    await this.assertWorkspaceAccess(userId, tire.vehicleId);

    if (tire.status === TireStatus.MOUNTED) {
      throw new ForbiddenException(ErrorCodes.Tire.ALREADY_MOUNTED);
    }

    await this.tiresRepo.delete(id);
  }

  // ─── Timeline integration ─────────────────────────────────────────────────

  /**
   * Called by TimelineService when a TIRE_CHANGE event installs a tire.
   * Automatically demotes any other MOUNTED tire on the same vehicle to STORED,
   * since a vehicle can only have one mounted set at a time.
   */
  async mount(tireId: string, vehicleId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const currentlyMounted = await this.tiresRepo.findMountedByVehicleId(vehicleId, tx);

    for (const mounted of currentlyMounted) {
      if (mounted.id !== tireId) {
        await this.tiresRepo.update(mounted.id, { status: TireStatus.STORED }, tx);
      }
    }

    await this.tiresRepo.update(tireId, { status: TireStatus.MOUNTED }, tx);
  }

  async unmount(tireId: string, tx?: Prisma.TransactionClient): Promise<void> {
    await this.tiresRepo.update(tireId, { status: TireStatus.STORED }, tx);
  }

  async getHistory(id: string): Promise<{ tire: TireResponseDto; history: TireHistory }> {
    const tire = await this.getById(id);
    const changes = await this.tiresRepo.findTireChangesByTireId(id);

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: tire.vehicleId },
      select: { currentMileage: true },
    });
    const currentMileage = vehicle?.currentMileage ?? 0;

    const periods: TirePeriod[] = [];
    let pendingInstall: { eventDate: Date; mileage: number | null } | null = null;

    for (const change of changes) {
      if (change.changeType === TireChangeType.INSTALL) {
        pendingInstall = { eventDate: change.eventDate, mileage: change.installedMileage };
        continue;
      }

      if (change.changeType === TireChangeType.REMOVE && pendingInstall) {
        const installedMileage = pendingInstall.mileage;
        const removedMileage = change.removedMileage ?? change.mileage;
        const kmDriven = installedMileage != null ? removedMileage - installedMileage : null;
        const daysDriven = Math.round(
          (change.eventDate.getTime() - pendingInstall.eventDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        periods.push({
          installedAt: pendingInstall.eventDate.toISOString(),
          installedMileage,
          removedAt: (change.removedDate ?? change.eventDate).toISOString(),
          removedMileage,
          kmDriven,
          daysDriven,
          isOngoing: false,
        });

        pendingInstall = null;
      }
    }

    if (pendingInstall) {
      const installedMileage = pendingInstall.mileage;
      const kmDriven = installedMileage != null ? currentMileage - installedMileage : null;
      const daysDriven = Math.round(
        (Date.now() - pendingInstall.eventDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      periods.push({
        installedAt: pendingInstall.eventDate.toISOString(),
        installedMileage,
        removedAt: null,
        removedMileage: null,
        kmDriven,
        daysDriven,
        isOngoing: true,
      });
    }

    const totalKmDriven = periods.reduce((sum, p) => sum + (p.kmDriven ?? 0), 0);

    return {
      tire: toTireResponse(tire),
      history: {
        periods,
        totalKmDriven,
        totalMountCount: periods.length,
      },
    };
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private async manualMount(tire: Tire, dto: UpdateTireDto): Promise<TireResponseDto> {
    const updated = await this.prisma.$transaction(async (tx) => {
      await this.mount(tire.id, tire.vehicleId, tx);

      if (this.hasOtherFields(dto)) {
        return this.tiresRepo.update(
          tire.id,
          {
            brand: dto.brand,
            model: dto.model,
            type: dto.type,
            width: dto.width,
            aspectRatio: dto.aspectRatio,
            rimDiameter: dto.rimDiameter,
            price: dto.price,
            storageLocation: dto.storageLocation,
            mileageAtPurchase: dto.mileageAtPurchase,
            quantity: dto.quantity,
            purchaseAt: dto.purchaseAt ? new Date(dto.purchaseAt) : undefined,
          },
          tx,
        );
      }

      return this.tiresRepo.findById(tire.id) as Promise<Tire>;
    });

    return toTireResponse(updated);
  }

  private hasOtherFields(dto: UpdateTireDto): boolean {
    return Object.entries(dto).some(([key, value]) => key !== 'status' && value !== undefined);
  }

  private async assertWorkspaceAccess(userId: string, vehicleId: string): Promise<void> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { workspaceId: true },
    });

    if (!vehicle) throw new NotFoundException(ErrorCodes.Vehicle.NOT_FOUND);

    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: vehicle.workspaceId, userId } },
    });

    if (!member) throw new ForbiddenException(ErrorCodes.Workspace.ACCESS_DENIED);
  }
}
