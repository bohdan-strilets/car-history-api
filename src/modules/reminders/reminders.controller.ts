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

import { CreateReminderDto, ReminderResponseDto, UpdateReminderDto } from './dto';
import { RemindersService } from './reminders.service';

@Controller('workspaces/:workspaceId/vehicles/:vehicleId/reminders')
@Auth()
@WorkspaceMember()
@UseGuards(VehicleAccessGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  getAll(@Param('vehicleId') vehicleId: string): Promise<ReminderResponseDto[]> {
    return this.remindersService.getAllByVehicleId(vehicleId);
  }

  @Post()
  @EmailVerified()
  create(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Body() dto: CreateReminderDto,
  ): Promise<ReminderResponseDto> {
    return this.remindersService.create(workspaceId, vehicleId, dto);
  }

  @Patch(':id')
  @EmailVerified()
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReminderDto,
  ): Promise<ReminderResponseDto> {
    return this.remindersService.update(workspaceId, vehicleId, id, dto);
  }

  @Patch(':id/complete')
  @EmailVerified()
  complete(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
  ): Promise<ReminderResponseDto> {
    return this.remindersService.complete(workspaceId, vehicleId, id);
  }

  @Patch(':id/dismiss')
  @EmailVerified()
  dismiss(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
  ): Promise<ReminderResponseDto> {
    return this.remindersService.dismiss(workspaceId, vehicleId, id);
  }

  @Delete(':id')
  @EmailVerified()
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('workspaceId') workspaceId: string,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.remindersService.delete(workspaceId, vehicleId, id);
  }
}
