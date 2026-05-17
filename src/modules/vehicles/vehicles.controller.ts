import { Auth, CurrentUserId } from '@common/decorators';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CreateVehicleDto } from './dto';
import { VehiclesService } from './vehicles.service';

@Controller('workspaces/:workspaceId/vehicles')
@Auth()
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  async getAll(@Param('workspaceId') workspaceId: string) {
    return this.vehiclesService.getAllByWorkspaceId(workspaceId);
  }

  @Post()
  async create(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateVehicleDto,
  ) {
    return this.vehiclesService.create(userId, workspaceId, dto);
  }
}
