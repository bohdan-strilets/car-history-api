import { Injectable } from '@nestjs/common';

import { MilestonesRepository } from './milestones.repository';
import { CheckContext, MilestoneCondition, MilestoneResult, VehicleContext } from './types';

@Injectable()
export class MilestonesService {
  constructor(private readonly milestonesRepository: MilestonesRepository) {}

  // ─── Queries ───────────────────────────────────────────────────────────────

  async getVehicleMilestones(vehicleId: string) {
    return this.milestonesRepository.findByVehicle(vehicleId);
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
      const days = Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

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
}
