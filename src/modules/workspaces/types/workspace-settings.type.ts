import { Currency, DateFormat, DistanceUnit, FuelUnit } from '@prisma/client';

export interface UpdateWorkspaceSettingsInput {
  currency?: Currency;
  timezone?: string;
  distanceUnit?: DistanceUnit;
  fuelUnit?: FuelUnit;
  dateFormat?: DateFormat;
}
