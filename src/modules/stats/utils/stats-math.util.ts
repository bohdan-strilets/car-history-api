import { MONTH_STRING_LENGTH, STATS_ROUNDING } from '@common/constants';

import { MonthCost } from '../types';

export const formatMonth = (date: Date): string => date.toISOString().slice(0, MONTH_STRING_LENGTH);

export const findExtremeMonth = (months: MonthCost[], mode: 'min' | 'max'): MonthCost | null => {
  if (months.length === 0) return null;

  return months.reduce((acc, curr) =>
    mode === 'min'
      ? curr.totalCost < acc.totalCost
        ? curr
        : acc
      : curr.totalCost > acc.totalCost
        ? curr
        : acc,
  );
};

export const calculateChangePercent = (current: number, previous: number | null): number | null => {
  if (previous === null || previous === 0) return null;

  return Number((((current - previous) / previous) * 100).toFixed(STATS_ROUNDING.PERCENT_DECIMALS));
};
