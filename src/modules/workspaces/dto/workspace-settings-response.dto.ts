import { Currency, DateFormat, DistanceUnit, FuelUnit } from '@prisma/client';

export class WorkspaceSettingsResponseDto {
  declare currency: Currency;
  declare timezone: string;
  declare distanceUnit: DistanceUnit;
  declare fuelUnit: FuelUnit;
  declare dateFormat: DateFormat;
}
