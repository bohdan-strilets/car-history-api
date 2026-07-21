import { DASHBOARD_UPCOMING_REMINDERS_LIMIT } from '@common/constants';
import { RemindersService } from '@modules/reminders';
import { VehiclesService } from '@modules/vehicles';
import { Injectable } from '@nestjs/common';
import { DocumentType } from '@prisma/client';

import { DashboardRepository } from './dashboard.repository';
import { DashboardResponseDto } from './dto';
import { toDashboardVehicleResponse } from './mappers';
import { NearestDocumentRow } from './types';
import { getCurrentMonthRange, getCurrentYearRange, sortRemindersByUrgency } from './utils';

@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboardRepo: DashboardRepository,
    private readonly vehiclesService: VehiclesService,
    private readonly remindersService: RemindersService,
  ) {}

  getDashboard = async (workspaceId: string): Promise<DashboardResponseDto> => {
    const vehicles = await this.vehiclesService.getAllByWorkspaceId(workspaceId);
    const vehicleIds = vehicles.map((vehicle) => vehicle.id);

    if (vehicleIds.length === 0) {
      return {
        vehicles: [],
        expensesSummary: { currentMonth: 0, currentYear: 0 },
        upcomingReminders: [],
      };
    }

    const monthRange = getCurrentMonthRange();
    const yearRange = getCurrentYearRange();

    const [nearestDocuments, currentMonthCost, currentYearCost, reminders] = await Promise.all([
      this.dashboardRepo.findNearestDocumentsByVehicleIds(vehicleIds),
      this.dashboardRepo.findExpensesSum(vehicleIds, monthRange.from, monthRange.to),
      this.dashboardRepo.findExpensesSum(vehicleIds, yearRange.from, yearRange.to),
      this.remindersService.getActiveByVehicleIds(vehicleIds),
    ]);

    const nearestDocumentByVehicle = this.buildNearestDocumentMap(nearestDocuments);
    const currentMileageByVehicleId = new Map(vehicles.map((v) => [v.id, v.currentMileage]));

    const vehiclesWithDocuments = vehicles.map((vehicle) =>
      toDashboardVehicleResponse(vehicle, nearestDocumentByVehicle.get(vehicle.id)),
    );

    const upcomingReminders = sortRemindersByUrgency(reminders, currentMileageByVehicleId).slice(
      0,
      DASHBOARD_UPCOMING_REMINDERS_LIMIT,
    );

    return {
      vehicles: vehiclesWithDocuments,
      expensesSummary: { currentMonth: currentMonthCost, currentYear: currentYearCost },
      upcomingReminders,
    };
  };

  // ─── Private ──────────────────────────────────────────────────────────────

  private buildNearestDocumentMap = (
    rows: NearestDocumentRow[],
  ): Map<string, { expireDate: Date; type: DocumentType }> => {
    const latestByVehicleAndType = new Map<string, Map<DocumentType, Date>>();

    for (const row of rows) {
      const byType = latestByVehicleAndType.get(row.vehicleId) ?? new Map<DocumentType, Date>();
      const current = byType.get(row.type);

      if (!current || row.expireDate > current) {
        byType.set(row.type, row.expireDate);
      }

      latestByVehicleAndType.set(row.vehicleId, byType);
    }

    const nearestByVehicle = new Map<string, { expireDate: Date; type: DocumentType }>();

    for (const [vehicleId, byType] of latestByVehicleAndType) {
      let nearest: { expireDate: Date; type: DocumentType } | null = null;

      for (const [type, expireDate] of byType) {
        if (!nearest || expireDate < nearest.expireDate) {
          nearest = { expireDate, type };
        }
      }

      if (nearest) nearestByVehicle.set(vehicleId, nearest);
    }

    return nearestByVehicle;
  };
}
