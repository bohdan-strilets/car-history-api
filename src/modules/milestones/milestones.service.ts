import { TIME_UNITS } from '@common/constants';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { MilestonesRepository } from './milestones.repository';
import {
  CheckContext,
  MilestoneCondition,
  MilestoneResult,
  VehicleContext,
  VehicleLatestMilestoneInfo,
} from './types';

@Injectable()
export class MilestonesService {
  constructor(private readonly milestonesRepository: MilestonesRepository) {}

  // ─── Queries ───────────────────────────────────────────────────────────────

  async getVehicleMilestones(vehicleId: string) {
    return this.milestonesRepository.findByVehicle(vehicleId);
  }

  async getLatestByVehicleIds(
    vehicleIds: string[],
  ): Promise<Map<string, VehicleLatestMilestoneInfo | null>> {
    const result = new Map<string, VehicleLatestMilestoneInfo | null>(
      vehicleIds.map((id) => [id, null]),
    );

    const achievements = await this.milestonesRepository.findLatestByVehicleIds(vehicleIds);

    const seen = new Set<string>();
    for (const achievement of achievements) {
      if (seen.has(achievement.vehicleId)) continue; // keep only the most recent per vehicle
      seen.add(achievement.vehicleId);

      result.set(achievement.vehicleId, {
        code: achievement.milestoneDefinition.code,
        title: achievement.milestoneDefinition.title,
        category: achievement.milestoneDefinition.category,
      });
    }

    return result;
  }

  // ─── Check & Award ─────────────────────────────────────────────────────────

  async checkAndAward(ctx: CheckContext): Promise<void> {
    const [definitions, vehicle] = await Promise.all([
      this.milestonesRepository.findDefinitions(),
      this.milestonesRepository.getVehicle(ctx.vehicleId),
    ]);

    if (!vehicle) return;

    for (const definition of definitions) {
      const condition = definition.condition as MilestoneCondition;

      const already = await this.milestonesRepository.findAchieved(ctx.vehicleId, definition.id);
      if (already) continue;

      const result = await this.evaluate(condition, ctx, vehicle);

      if (result.achieved) {
        await this.milestonesRepository.create({
          userId: ctx.userId,
          vehicleId: ctx.vehicleId,
          milestoneDefinitionId: definition.id,
          value: result.value,
          mileage: ctx.mileage ?? 0,
          achievedAt: new Date(),
        });
      }
    }
  }

  // ─── Evaluator ─────────────────────────────────────────────────────────────

  private async evaluate(
    condition: MilestoneCondition,
    ctx: CheckContext,
    vehicle: VehicleContext,
  ): Promise<MilestoneResult> {
    switch (condition.type) {
      case 'MILEAGE_SINCE_REGISTRATION': {
        const mileageFromLogs = await this.milestonesRepository.getMileageFromLogs(ctx.vehicleId);
        const registrationMileage = vehicle.registrationMileage;
        const mileageSince = mileageFromLogs - registrationMileage;
        return {
          achieved: mileageSince >= (condition.value ?? 0),
          value: condition.value ?? mileageSince,
        };
      }

      case 'TOTAL_EXPENSES': {
        const total = await this.milestonesRepository.getTotalExpenses(ctx.vehicleId);
        return {
          achieved: total >= (condition.value ?? 0),
          value: condition.value ?? total,
        };
      }

      case 'EVENT_COUNT': {
        const count = await this.milestonesRepository.getEventCount(
          ctx.vehicleId,
          condition.eventType,
        );
        return {
          achieved: count >= (condition.value ?? 0),
          value: condition.value ?? count,
        };
      }

      case 'TOTAL_LITERS': {
        const liters = await this.milestonesRepository.getTotalLiters(ctx.vehicleId);
        return {
          achieved: liters >= (condition.value ?? 0),
          value: condition.value ?? liters,
        };
      }

      default:
        return { achieved: false, value: 0 };
    }
  }

  // ─── Ownership Cron Check ──────────────────────────────────────────────────
  async checkOwnershipMilestones(): Promise<void> {
    const [definitions, vehicles] = await Promise.all([
      this.milestonesRepository.findDefinitions(),
      this.milestonesRepository.getActiveVehicles(),
    ]);

    const ownershipDefinitions = definitions.filter(
      (d) => (d.condition as MilestoneCondition).type === 'OWNERSHIP_DAYS',
    );

    for (const vehicle of vehicles) {
      const purchaseInfo = vehicle.purchaseInfo as { date?: string } | null;
      if (!purchaseInfo?.date) continue;

      const purchaseDate = new Date(purchaseInfo.date);
      const days = Math.floor(
        (Date.now() - purchaseDate.getTime()) / TIME_UNITS.MILLISECONDS_PER_DAY,
      );

      for (const definition of ownershipDefinitions) {
        const condition = definition.condition as MilestoneCondition;
        const already = await this.milestonesRepository.findAchieved(vehicle.id, definition.id);
        if (already) continue;

        if (days >= (condition.value ?? 0)) {
          await this.milestonesRepository.create({
            userId: vehicle.ownerId,
            vehicleId: vehicle.id,
            milestoneDefinitionId: definition.id,
            value: condition.value ?? days,
            mileage: vehicle.currentMileage,
            achievedAt: new Date(),
          });
        }
      }
    }
  }

  async deleteAllByVehicleId(vehicleId: string, tx?: Prisma.TransactionClient): Promise<void> {
    await this.milestonesRepository.deleteAllByVehicleId(vehicleId, tx);
  }
}
