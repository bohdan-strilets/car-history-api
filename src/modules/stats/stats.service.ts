import {
  DATE_ONLY_STRING_LENGTH,
  STATS_ROUNDING,
  STATS_TOP_CATEGORIES_LIMIT,
} from '@common/constants';
import { Injectable } from '@nestjs/common';

import { StatsQueryDto } from './dto';
import { StatsRepository } from './stats.repository';
import { StatsPeriod, VehicleStatsInfo } from './types';
import {
  calculateChangePercent,
  calculateFuelConsumptionTrend,
  findExtremeMonth,
  formatMonth,
  getCalendarYearRange,
  getPreviousStatsPeriodRange,
  getStatsPeriodRange,
  groupFuelCostsByType,
  hasMultipleFuelTypes,
} from './utils';

@Injectable()
export class StatsService {
  constructor(private readonly statsRepository: StatsRepository) {}

  getVehicleStats = async (vehicleId: string, query: StatsQueryDto) => {
    const { period, date } = query;
    const { from, to } = getStatsPeriodRange(period, date);

    const vehicleInfo: VehicleStatsInfo =
      await this.statsRepository.findVehicleMileageAndPurchaseInfo(vehicleId);

    const [
      costsByType,
      costsByMonthRaw,
      previousPeriodTotal,
      fuelRefuels,
      fuelCostsByTypeRaw,
      costsByStationRaw,
      insurance,
      tco,
    ] = await Promise.all([
      this.statsRepository.findCostsGroupedByType(vehicleId, from, to),
      this.statsRepository.findCostsGroupedByMonth(vehicleId, from, to),
      this.getPreviousPeriodTotal(vehicleId, period, date),
      this.statsRepository.findFullTankRefuelsUpTo(vehicleId, to),
      this.statsRepository.findFuelCostsByType(vehicleId, from, to),
      this.statsRepository.findCostsGroupedByServiceStation(vehicleId, from, to),
      this.getInsuranceCost(vehicleId, date),
      this.getTco(vehicleId, vehicleInfo),
    ]);

    const costsByCategory = costsByType.map((row) => ({
      type: row.type,
      totalCost: Number(row._sum.cost ?? 0),
      count: row._count._all,
    }));

    const topCategories = [...costsByCategory]
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, STATS_TOP_CATEGORIES_LIMIT);

    const totalCost = costsByCategory.reduce((sum, row) => sum + row.totalCost, 0);

    const costsByMonth = costsByMonthRaw.map((row) => ({
      month: formatMonth(row.month),
      totalCost: Number(row.totalCost ?? 0),
    }));

    const avgCostPerKm = await this.calculateAvgCostPerKm(
      vehicleId,
      from,
      to,
      totalCost,
      vehicleInfo,
    );

    const fuelConsumption = calculateFuelConsumptionTrend(fuelRefuels, from);

    const fuelCostByTypeGrouped = groupFuelCostsByType(fuelCostsByTypeRaw);
    const fuelCostByType = hasMultipleFuelTypes(fuelCostByTypeGrouped)
      ? fuelCostByTypeGrouped
      : null;

    const costsByServiceStation = await this.resolveServiceStationNames(costsByStationRaw);

    return {
      period: {
        from: from?.toISOString().slice(0, DATE_ONLY_STRING_LENGTH) ?? null,
        to: to?.toISOString().slice(0, DATE_ONLY_STRING_LENGTH) ?? null,
        type: period,
      },
      totalCost,
      costsByCategory: topCategories, // "top categories" = same grouping, sorted
      costsByMonth,
      cheapestMonth: findExtremeMonth(costsByMonth, 'min'),
      mostExpensiveMonth: findExtremeMonth(costsByMonth, 'max'),
      previousPeriodComparison:
        period === StatsPeriod.ALL
          ? null
          : {
              currentTotal: totalCost,
              previousTotal: previousPeriodTotal,
              changePercent: calculateChangePercent(totalCost, previousPeriodTotal),
            },
      avgCostPerKm,
      fuelConsumption,
      fuelCostByType,
      costsByServiceStation,
      insuranceCost: insurance,
      tco,
    };
  };

  private getPreviousPeriodTotal = async (
    vehicleId: string,
    period: StatsPeriod,
    date?: string,
  ) => {
    if (period === StatsPeriod.ALL) return null;

    const { from, to } = getPreviousStatsPeriodRange(period, date);
    const rows = await this.statsRepository.findCostsGroupedByType(vehicleId, from, to);

    return rows.reduce((sum, row) => sum + Number(row._sum.cost ?? 0), 0);
  };

  private calculateAvgCostPerKm = async (
    vehicleId: string,
    from: Date | null,
    to: Date | null,
    totalCost: number,
    vehicleInfo: VehicleStatsInfo,
  ): Promise<number | null> => {
    if (!vehicleInfo || totalCost === 0) return null;

    const mileageAtTo = to
      ? ((await this.statsRepository.findMileageAtOrBeforeDate(vehicleId, to))?.mileage ??
        vehicleInfo.currentMileage)
      : vehicleInfo.currentMileage;

    const mileageAtFrom = from
      ? ((await this.statsRepository.findMileageAtOrBeforeDate(vehicleId, from))?.mileage ?? 0)
      : 0;

    const distance = mileageAtTo - mileageAtFrom;

    if (distance <= 0) return null;

    return Number((totalCost / distance).toFixed(STATS_ROUNDING.COST_DECIMALS));
  };

  private resolveServiceStationNames = async (
    rows: { serviceStationId: string | null; _sum: { cost: unknown }; _count: { _all: number } }[],
  ) => {
    const ids = rows.map((row) => row.serviceStationId).filter((id): id is string => id !== null);

    if (ids.length === 0) return [];

    const stations = await this.statsRepository.findServiceStationsByIds(ids);
    const stationMap = new Map(stations.map((s) => [s.id, s]));

    return rows
      .map((row) => {
        const station = row.serviceStationId ? stationMap.get(row.serviceStationId) : undefined;
        if (!station) return null;

        return {
          serviceStationId: station.id,
          name: station.name,
          totalCost: Number(row._sum.cost ?? 0),
          visitCount: station.visitCount,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => b.totalCost - a.totalCost);
  };

  private getInsuranceCost = async (vehicleId: string, date?: string) => {
    const { from, to } = getCalendarYearRange(date);
    const rows = await this.statsRepository.findInsuranceCosts(vehicleId, from, to);

    const oc = rows
      .filter((r) => r.document?.type === 'INSURANCE_OC')
      .reduce((sum, r) => sum + Number(r.cost ?? 0), 0);

    const ac = rows
      .filter((r) => r.document?.type === 'INSURANCE_AC')
      .reduce((sum, r) => sum + Number(r.cost ?? 0), 0);

    return { year: from.getFullYear(), oc, ac, total: oc + ac };
  };

  private getTco = async (vehicleId: string, vehicleInfo: VehicleStatsInfo) => {
    const purchaseDate = (vehicleInfo?.purchaseInfo as { date?: string } | null)?.date ?? null;

    const totalCostRaw = await this.statsRepository.findTotalCostSince(
      vehicleId,
      purchaseDate ? new Date(purchaseDate) : null,
    );
    const totalCost = Number(totalCostRaw ?? 0);

    const purchaseMileage =
      (vehicleInfo?.purchaseInfo as { mileage?: number } | null)?.mileage ?? 0;
    const distance = (vehicleInfo?.currentMileage ?? 0) - purchaseMileage;

    return {
      sincePurchaseDate: purchaseDate,
      totalCost,
      costPerKm:
        distance > 0 ? Number((totalCost / distance).toFixed(STATS_ROUNDING.COST_DECIMALS)) : null,
    };
  };
}
