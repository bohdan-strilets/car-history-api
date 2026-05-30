import { Auth, CurrentUserId, EmailVerified, WorkspaceMember } from '@common/decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateVehicleDto, UpdateVehicleDto } from './dto';
import { VehiclesService } from './vehicles.service';

@Controller('workspaces/:workspaceId/vehicles')
@Auth()
@WorkspaceMember()
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  async getAll(@Param('workspaceId') workspaceId: string) {
    return this.vehiclesService.getAllByWorkspaceId(workspaceId);
  }

  @Get(':vehicleId')
  async getOne(@Param('vehicleId') vehicleId: string) {
    return this.vehiclesService.getById(vehicleId);
  }

  @Post()
  @EmailVerified()
  async create(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateVehicleDto,
  ) {
    return this.vehiclesService.create(userId, workspaceId, dto);
  }

  @Patch(':vehicleId')
  @EmailVerified()
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(workspaceId, vehicleId, dto);
  }

  @Delete(':vehicleId')
  @EmailVerified()
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('workspaceId') workspaceId: string, @Param('vehicleId') vehicleId: string) {
    return this.vehiclesService.delete(workspaceId, vehicleId);
  }
}
