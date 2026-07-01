import { JwtAuthGuard, VehicleAccessGuard, WorkspaceMemberGuard } from '@common/guards';
import { applyDecorators, UseGuards } from '@nestjs/common';

export const VehicleAccess = () =>
  applyDecorators(UseGuards(JwtAuthGuard, WorkspaceMemberGuard, VehicleAccessGuard));
