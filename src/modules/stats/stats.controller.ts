import { VehicleAccess } from '@common/decorators';
import { Controller, Get, Param, Query } from '@nestjs/common';

import { StatsQueryDto } from './dto';
import { StatsService } from './stats.service';

@Controller('workspaces/:workspaceId/vehicles/:vehicleId/stats')
@VehicleAccess()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  getVehicleStats(@Param('vehicleId') vehicleId: string, @Query() query: StatsQueryDto) {
    return this.statsService.getVehicleStats(vehicleId, query);
  }
}
