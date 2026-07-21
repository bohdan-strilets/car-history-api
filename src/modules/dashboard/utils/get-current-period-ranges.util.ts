import { CALENDAR } from '@common/constants';

export type PeriodRange = { from: Date; to: Date };

export const getCurrentMonthRange = (now: Date = new Date()): PeriodRange => ({
  from: new Date(now.getFullYear(), now.getMonth(), CALENDAR.FIRST_DAY_OF_MONTH),
  to: now,
});

export const getCurrentYearRange = (now: Date = new Date()): PeriodRange => ({
  from: new Date(now.getFullYear(), CALENDAR.FIRST_MONTH_INDEX, CALENDAR.FIRST_DAY_OF_MONTH),
  to: now,
});
