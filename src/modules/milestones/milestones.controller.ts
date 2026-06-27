import { Auth, WorkspaceMember } from '@common/decorators';
import { VehicleAccessGuard } from '@common/guards';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { MilestonesService } from './milestones.service';

@Controller('workspaces/:workspaceId/vehicles/:vehicleId/milestones')
@Auth()
@WorkspaceMember()
@UseGuards(VehicleAccessGuard)
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Get()
  getVehicleMilestones(@Param('vehicleId') vehicleId: string) {
    return this.milestonesService.getVehicleMilestones(vehicleId);
  }
}
