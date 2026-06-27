import { Auth, EmailVerified, WorkspaceMember } from '@common/decorators';
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

import {
  CreateMaintenanceIntervalDto,
  MaintenanceIntervalResponseDto,
  UpdateMaintenanceIntervalDto,
} from './dto';
import { MaintenanceIntervalsService } from './maintenance-intervals.service';

@Controller('workspaces/:workspaceId/vehicles/:vehicleId/maintenance')
@Auth()
@WorkspaceMember()
@UseGuards(VehicleAccessGuard)
export class MaintenanceIntervalsController {
  constructor(private readonly maintenanceIntervalsService: MaintenanceIntervalsService) {}

  @Get()
  getAll(@Param('vehicleId') vehicleId: string): Promise<MaintenanceIntervalResponseDto[]> {
    return this.maintenanceIntervalsService.getAllByVehicleId(vehicleId);
  }

  @Post()
  @EmailVerified()
  create(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Body() dto: CreateMaintenanceIntervalDto,
  ): Promise<MaintenanceIntervalResponseDto> {
    return this.maintenanceIntervalsService.create(workspaceId, vehicleId, dto);
  }

  @Patch(':id')
  @EmailVerified()
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceIntervalDto,
  ): Promise<MaintenanceIntervalResponseDto> {
    return this.maintenanceIntervalsService.update(workspaceId, vehicleId, id, dto);
  }

  @Patch(':id/disable')
  @EmailVerified()
  disable(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
  ): Promise<MaintenanceIntervalResponseDto> {
    return this.maintenanceIntervalsService.disable(workspaceId, vehicleId, id);
  }

  @Patch(':id/enable')
  @EmailVerified()
  enable(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
  ): Promise<MaintenanceIntervalResponseDto> {
    return this.maintenanceIntervalsService.enable(workspaceId, vehicleId, id);
  }

  @Patch(':id/mark-done')
  @EmailVerified()
  markAsDone(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
    @Body('currentMileage') currentMileage: number,
  ): Promise<MaintenanceIntervalResponseDto> {
    return this.maintenanceIntervalsService.markAsDone(workspaceId, vehicleId, id, currentMileage);
  }

  @Delete(':id')
  @EmailVerified()
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.maintenanceIntervalsService.delete(workspaceId, vehicleId, id);
  }
}
