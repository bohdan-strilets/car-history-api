export const STATS_TOP_CATEGORIES_LIMIT = 5;

export const CALENDAR = {
  FIRST_MONTH_INDEX: 0,
  LAST_MONTH_INDEX: 11,
  FIRST_DAY_OF_MONTH: 1,

  LAST_DAY_OF_PREVIOUS_MONTH: 0,
  MONTHS_PER_QUARTER: 3,
  MONTHS_PER_YEAR: 12,
} as const;

export const DAY_BOUNDARY = {
  START: { hours: 0, minutes: 0, seconds: 0, ms: 0 },
  END: { hours: 23, minutes: 59, seconds: 59, ms: 999 },
} as const;

export const DATE_STRING_PAD_LENGTH = 2;
export const DATE_STRING_PAD_CHAR = '0';

export const FUEL_CONSUMPTION_DISTANCE_UNIT_KM = 100;

export const STATS_ROUNDING = {
  COST_DECIMALS: 2,
  CONSUMPTION_DECIMALS: 2,
  PRICE_DECIMALS: 2,
  PERCENT_DECIMALS: 1,
} as const;

export const MONTH_STRING_LENGTH = 7;
export const DATE_ONLY_STRING_LENGTH = 10;
