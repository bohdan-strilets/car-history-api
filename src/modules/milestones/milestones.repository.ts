import { VehiclePurchaseInfo } from '@modules/vehicles';
import { Injectable } from '@nestjs/common';
import { TimelineType } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { vehicleSelect } from './selects';
import { CreateMilestoneInput, VehicleContext } from './types';

@Injectable()
export class MilestonesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDefinitions() {
    return this.prisma.milestoneDefinition.findMany();
  }

  async findByVehicle(vehicleId: string) {
    return this.prisma.vehicleMilestone.findMany({
      where: { vehicleId },
      include: { milestoneDefinition: true },
      orderBy: { achievedAt: 'desc' },
    });
  }

  async findAchieved(vehicleId: string, definitionId: string) {
    return this.prisma.vehicleMilestone.findFirst({
      where: { vehicleId, milestoneDefinitionId: definitionId },
    });
  }

  async create(data: CreateMilestoneInput) {
    return this.prisma.vehicleMilestone.create({ data });
  }

  async getTotalExpenses(vehicleId: string): Promise<number> {
    const result = await this.prisma.timelineEvent.aggregate({
      where: {
        vehicleId,
        deletedAt: null,
        cost: { not: null },
        type: { notIn: ['PURCHASE', 'SALE'] },
      },
      _sum: { cost: true },
    });
    return result._sum.cost?.toNumber() ?? 0;
  }

  async getEventCount(vehicleId: string, eventType?: string): Promise<number> {
    const isValidType = eventType && eventType !== 'ANY' && eventType in TimelineType;

    return this.prisma.timelineEvent.count({
      where: {
        vehicleId,
        deletedAt: null,
        ...(isValidType ? { type: eventType as TimelineType } : {}),
      },
    });
  }

  async getTotalLiters(vehicleId: string): Promise<number> {
    const result = await this.prisma.refuel.aggregate({
      where: { event: { vehicleId, deletedAt: null } },
      _sum: { liters: true },
    });
    return result._sum.liters?.toNumber() ?? 0;
  }

  async getVehicle(vehicleId: string): Promise<VehicleContext | null> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: vehicleSelect,
    });

    if (!vehicle) return null;

    return {
      currentMileage: vehicle.currentMileage,
      registrationMileage: vehicle.registrationMileage,
      purchaseInfo: vehicle.purchaseInfo as VehiclePurchaseInfo | null,
    };
  }

  async getMileageFromLogs(vehicleId: string): Promise<number> {
    const result = await this.prisma.mileageLog.aggregate({
      where: {
        vehicleId,
        source: { notIn: ['PURCHASE', 'SALE', 'MANUAL'] },
      },
      _max: { mileage: true },
    });
    return result._max.mileage ?? 0;
  }

  async getActiveVehicles() {
    return this.prisma.vehicle.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      select: {
        id: true,
        ownerId: true,
        currentMileage: true,
        registrationMileage: true,
        purchaseInfo: true,
      },
    });
  }
}
