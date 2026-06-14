import { Auth, WorkspaceMember } from '@common/decorators';
import { Controller, Get, Param } from '@nestjs/common';

import { MilestonesService } from './milestones.service';

@Controller('workspaces/:workspaceId/vehicles/:vehicleId/milestones')
@Auth()
@WorkspaceMember()
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Get()
  getVehicleMilestones(@Param('vehicleId') vehicleId: string) {
    return this.milestonesService.getVehicleMilestones(vehicleId);
  }
}
