import { WorkspaceSettings } from '@prisma/client';

import { WorkspaceSettingsResponseDto } from '../dto';

export const toWorkspaceSettingsResponse = (
  settings: WorkspaceSettings,
): WorkspaceSettingsResponseDto => ({
  currency: settings.currency,
  timezone: settings.timezone,
  distanceUnit: settings.distanceUnit,
  fuelUnit: settings.fuelUnit,
  dateFormat: settings.dateFormat,
});
