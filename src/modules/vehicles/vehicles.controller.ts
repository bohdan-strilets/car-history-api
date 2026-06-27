import { Auth, CurrentUserId, EmailVerified, WorkspaceMember } from '@common/decorators';
import { VehicleAccessGuard } from '@common/guards';
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
  UseGuards,
} from '@nestjs/common';

import { CreateVehicleDto, UpdateVehicleDto, UpdateVehicleSpecsDto } from './dto';
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
  @UseGuards(VehicleAccessGuard)
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
  @UseGuards(VehicleAccessGuard)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(workspaceId, vehicleId, dto);
  }

  @Patch(':vehicleId/specs')
  @EmailVerified()
  @UseGuards(VehicleAccessGuard)
  async updateSpecs(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Body() dto: UpdateVehicleSpecsDto,
  ) {
    return this.vehiclesService.updateSpecs(workspaceId, vehicleId, dto);
  }

  @Delete(':vehicleId')
  @EmailVerified()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(VehicleAccessGuard)
  async delete(@Param('workspaceId') workspaceId: string, @Param('vehicleId') vehicleId: string) {
    return this.vehiclesService.delete(workspaceId, vehicleId);
  }

  @Post(':vehicleId/specs/ai')
  @EmailVerified()
  @UseGuards(VehicleAccessGuard)
  async fillSpecsWithAi(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
  ) {
    return this.vehiclesService.fillSpecsWithAi(workspaceId, vehicleId);
  }
}
