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
  CreateMaintenanceDto,
  MaintenanceResponseDto,
  MarkMaintenanceDoneDto,
  UpdateMaintenanceDto,
} from './dto';
import { MaintenanceService } from './maintenance.service';

@Controller('workspaces/:workspaceId/vehicles/:vehicleId/maintenance')
@Auth()
@WorkspaceMember()
@UseGuards(VehicleAccessGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  getAll(@Param('vehicleId') vehicleId: string): Promise<MaintenanceResponseDto[]> {
    return this.maintenanceService.getAllByVehicleId(vehicleId);
  }

  @Post()
  @EmailVerified()
  create(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Body() dto: CreateMaintenanceDto,
  ): Promise<MaintenanceResponseDto> {
    return this.maintenanceService.create(workspaceId, vehicleId, dto);
  }

  @Patch(':id')
  @EmailVerified()
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceDto,
  ): Promise<MaintenanceResponseDto> {
    return this.maintenanceService.update(workspaceId, vehicleId, id, dto);
  }

  @Patch(':id/disable')
  @EmailVerified()
  disable(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
  ): Promise<MaintenanceResponseDto> {
    return this.maintenanceService.disable(workspaceId, vehicleId, id);
  }

  @Patch(':id/enable')
  @EmailVerified()
  enable(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
  ): Promise<MaintenanceResponseDto> {
    return this.maintenanceService.enable(workspaceId, vehicleId, id);
  }

  @Patch(':id/mark-done')
  @EmailVerified()
  markAsDone(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
    @Body() dto: MarkMaintenanceDoneDto,
  ): Promise<MaintenanceResponseDto> {
    return this.maintenanceService.markAsDone(workspaceId, vehicleId, id, {
      mileage: dto.mileage,
      date: new Date(dto.date),
    });
  }

  @Delete(':id')
  @EmailVerified()
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.maintenanceService.delete(workspaceId, vehicleId, id);
  }
}
