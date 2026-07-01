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
    @Param('vehicleId') vehicleId: string,
    @Body() dto: CreateMaintenanceDto,
  ): Promise<MaintenanceResponseDto> {
    return this.maintenanceService.create(vehicleId, dto);
  }

  @Patch(':id')
  @EmailVerified()
  update(
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceDto,
  ): Promise<MaintenanceResponseDto> {
    return this.maintenanceService.update(vehicleId, id, dto);
  }

  @Patch(':id/disable')
  @EmailVerified()
  disable(
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
  ): Promise<MaintenanceResponseDto> {
    return this.maintenanceService.disable(vehicleId, id);
  }

  @Patch(':id/enable')
  @EmailVerified()
  enable(
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
  ): Promise<MaintenanceResponseDto> {
    return this.maintenanceService.enable(vehicleId, id);
  }

  @Patch(':id/mark-done')
  @EmailVerified()
  markAsDone(
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
    @Body() dto: MarkMaintenanceDoneDto,
  ): Promise<MaintenanceResponseDto> {
    return this.maintenanceService.markAsDone(vehicleId, id, {
      mileage: dto.mileage,
      date: new Date(dto.date),
    });
  }

  @Delete(':id')
  @EmailVerified()
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('vehicleId') vehicleId: string, @Param('id') id: string): Promise<void> {
    return this.maintenanceService.delete(vehicleId, id);
  }
}
