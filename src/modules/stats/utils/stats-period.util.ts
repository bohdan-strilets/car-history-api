import {
  CALENDAR,
  DATE_STRING_PAD_CHAR,
  DATE_STRING_PAD_LENGTH,
  DAY_BOUNDARY,
} from '@common/constants';

import { StatsPeriod } from '../dto';
import { CalendarYearRange, PeriodRange } from '../types';

const parseLocalDate = (dateStr?: string): Date => {
  if (!dateStr) return new Date();

  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - CALENDAR.FIRST_DAY_OF_MONTH, day);
};

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + CALENDAR.FIRST_DAY_OF_MONTH).padStart(
    DATE_STRING_PAD_LENGTH,
    DATE_STRING_PAD_CHAR,
  );
  const day = String(date.getDate()).padStart(DATE_STRING_PAD_LENGTH, DATE_STRING_PAD_CHAR);

  return `${year}-${month}-${day}`;
};

const applyDayBoundaries = (from: Date, to: Date): void => {
  const { START, END } = DAY_BOUNDARY;

  from.setHours(START.hours, START.minutes, START.seconds, START.ms);
  to.setHours(END.hours, END.minutes, END.seconds, END.ms);
};

export const getStatsPeriodRange = (period: StatsPeriod, dateStr?: string): PeriodRange => {
  if (period === StatsPeriod.ALL) return { from: null, to: null };

  const anchor = parseLocalDate(dateStr);
  const from = new Date(anchor);
  const to = new Date(anchor);

  if (period === StatsPeriod.MONTH) {
    from.setDate(CALENDAR.FIRST_DAY_OF_MONTH);
    to.setMonth(to.getMonth() + 1, CALENDAR.LAST_DAY_OF_PREVIOUS_MONTH);
  }

  if (period === StatsPeriod.QUARTER) {
    const quarterStartMonth =
      Math.floor(from.getMonth() / CALENDAR.MONTHS_PER_QUARTER) * CALENDAR.MONTHS_PER_QUARTER;

    from.setMonth(quarterStartMonth, CALENDAR.FIRST_DAY_OF_MONTH);
    to.setMonth(
      quarterStartMonth + CALENDAR.MONTHS_PER_QUARTER,
      CALENDAR.LAST_DAY_OF_PREVIOUS_MONTH,
    );
  }

  if (period === StatsPeriod.YEAR) {
    from.setMonth(CALENDAR.FIRST_MONTH_INDEX, CALENDAR.FIRST_DAY_OF_MONTH);
    to.setMonth(CALENDAR.MONTHS_PER_YEAR, CALENDAR.LAST_DAY_OF_PREVIOUS_MONTH);
  }

  applyDayBoundaries(from, to);

  return { from, to };
};

export const getPreviousStatsPeriodRange = (period: StatsPeriod, dateStr?: string): PeriodRange => {
  if (period === StatsPeriod.ALL) return { from: null, to: null };

  const anchor = parseLocalDate(dateStr);

  const shiftMap: Record<Exclude<StatsPeriod, StatsPeriod.ALL>, () => void> = {
    [StatsPeriod.MONTH]: () => anchor.setMonth(anchor.getMonth() - 1),
    [StatsPeriod.QUARTER]: () => anchor.setMonth(anchor.getMonth() - CALENDAR.MONTHS_PER_QUARTER),
    [StatsPeriod.YEAR]: () => anchor.setFullYear(anchor.getFullYear() - 1),
  };

  shiftMap[period]();

  return getStatsPeriodRange(period, formatLocalDate(anchor));
};

export const getCalendarYearRange = (dateStr?: string): CalendarYearRange => {
  const anchor = parseLocalDate(dateStr);
  const from = new Date(
    anchor.getFullYear(),
    CALENDAR.FIRST_MONTH_INDEX,
    CALENDAR.FIRST_DAY_OF_MONTH,
  );
  const to = new Date(
    anchor.getFullYear(),
    CALENDAR.MONTHS_PER_YEAR,
    CALENDAR.LAST_DAY_OF_PREVIOUS_MONTH,
  );

  applyDayBoundaries(from, to);

  return { from, to };
};
