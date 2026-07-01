export type PeriodRange = {
  from: Date | null;
  to: Date | null;
};

export type CalendarYearRange = {
  from: Date;
  to: Date;
};

export type FullTankRefuel = {
  id: string;
  eventDate: Date;
  mileage: number;
  refuel: { liters: unknown } | null;
};

export type FuelConsumptionPoint = {
  date: string;
  consumption: number;
  mileage: number;
};

export type FuelConsumptionResult = {
  avgLPer100Km: number | null;
  trend: FuelConsumptionPoint[];
};

export type MonthCost = {
  month: string;
  totalCost: number;
};

export type FuelCostRow = {
  cost: unknown;
  refuel: { fuelType: string; liters: unknown; pricePerLiter: unknown } | null;
};

export type FuelCostByType = {
  fuelType: string;
  totalLiters: number;
  totalCost: number;
  avgPricePerLiter: number;
};

export type VehicleStatsInfo = {
  currentMileage: number;
  purchaseInfo: unknown;
} | null;
