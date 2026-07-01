import {
  DATE_ONLY_STRING_LENGTH,
  FUEL_CONSUMPTION_DISTANCE_UNIT_KM,
  STATS_ROUNDING,
} from '@common/constants';

import { FuelConsumptionPoint, FuelConsumptionResult, FullTankRefuel } from '../types';

export const calculateFuelConsumptionTrend = (
  refuels: FullTankRefuel[],
  from: Date | null,
): FuelConsumptionResult => {
  const trend: FuelConsumptionPoint[] = [];

  for (let i = 1; i < refuels.length; i += 1) {
    const prev = refuels[i - 1];
    const curr = refuels[i];

    const distance = curr.mileage - prev.mileage;
    if (distance <= 0 || !curr.refuel) continue;

    const liters = Number(curr.refuel.liters);
    const consumption = (liters / distance) * FUEL_CONSUMPTION_DISTANCE_UNIT_KM;

    const isInPeriod = !from || curr.eventDate >= from;
    if (!isInPeriod) continue;

    trend.push({
      date: curr.eventDate.toISOString().slice(0, DATE_ONLY_STRING_LENGTH),
      consumption: Number(consumption.toFixed(STATS_ROUNDING.CONSUMPTION_DECIMALS)),
      mileage: curr.mileage,
    });
  }

  if (trend.length === 0) return { avgLPer100Km: null, trend: [] };

  const avg = trend.reduce((sum, point) => sum + point.consumption, 0) / trend.length;

  return {
    avgLPer100Km: Number(avg.toFixed(STATS_ROUNDING.CONSUMPTION_DECIMALS)),
    trend,
  };
};
