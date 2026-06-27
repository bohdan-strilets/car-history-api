// ────────────────────────────────────────────────────────────────────────────
// Time constants for token expiry, pagination, and calculations
// ────────────────────────────────────────────────────────────────────────────

// Token expiry times (in minutes)
export const TOKEN_EXPIRY = {
  EMAIL_VERIFICATION: 24 * 60, // 24 hours in minutes
  PASSWORD_RESET: 60, // 1 hour in minutes
  WORKSPACE_INVITE: 7 * 24 * 60, // 7 days in minutes
} as const;

// Time unit conversions (for calculations)
export const TIME_UNITS = {
  SECONDS_PER_MINUTE: 60,
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_HOUR: 60 * 60,
  SECONDS_PER_DAY: 24 * 60 * 60,
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
  MINUTES_PER_DAY: 24 * 60,
  HOURS_PER_DAY: 24,
} as const;

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Array indices (used for data extraction)
export const ARRAY_INDICES = {
  FIRST: 0,
} as const;
