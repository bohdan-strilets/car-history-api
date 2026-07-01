import { STATS_ROUNDING } from '@common/constants';

import { FuelCostByType, FuelCostRow } from '../types';

export const groupFuelCostsByType = (rows: FuelCostRow[]): FuelCostByType[] => {
  const map = new Map<string, { totalLiters: number; totalCost: number }>();

  for (const row of rows) {
    if (!row.refuel) continue;

    const key = row.refuel.fuelType;
    const liters = Number(row.refuel.liters);
    const cost = Number(row.cost ?? 0);

    const existing = map.get(key) ?? { totalLiters: 0, totalCost: 0 };
    map.set(key, {
      totalLiters: existing.totalLiters + liters,
      totalCost: existing.totalCost + cost,
    });
  }

  return Array.from(map.entries()).map(([fuelType, { totalLiters, totalCost }]) => ({
    fuelType,
    totalLiters: Number(totalLiters.toFixed(STATS_ROUNDING.CONSUMPTION_DECIMALS)),
    totalCost: Number(totalCost.toFixed(STATS_ROUNDING.COST_DECIMALS)),
    avgPricePerLiter:
      totalLiters > 0
        ? Number((totalCost / totalLiters).toFixed(STATS_ROUNDING.PRICE_DECIMALS))
        : 0,
  }));
};

export const hasMultipleFuelTypes = (grouped: FuelCostByType[]): boolean => grouped.length > 1;
