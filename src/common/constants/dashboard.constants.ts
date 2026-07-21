import { TimelineType } from '@prisma/client';

export const DASHBOARD_UPCOMING_REMINDERS_LIMIT = 5;

export const DASHBOARD_EXPENSE_EXCLUDED_TYPES: TimelineType[] = [
  TimelineType.PURCHASE,
  TimelineType.SALE,
  TimelineType.TRIP,
];
