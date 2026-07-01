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
    @Param('vehicleId') vehicleId: string,
    @Body() dto: CreateReminderDto,
  ): Promise<ReminderResponseDto> {
    return this.remindersService.create(vehicleId, dto);
  }

  @Patch(':id')
  @EmailVerified()
  update(
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReminderDto,
  ): Promise<ReminderResponseDto> {
    return this.remindersService.update(vehicleId, id, dto);
  }

  @Patch(':id/complete')
  @EmailVerified()
  complete(
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
  ): Promise<ReminderResponseDto> {
    return this.remindersService.complete(vehicleId, id);
  }

  @Patch(':id/dismiss')
  @EmailVerified()
  dismiss(
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
  ): Promise<ReminderResponseDto> {
    return this.remindersService.dismiss(vehicleId, id);
  }

  @Delete(':id')
  @EmailVerified()
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('vehicleId') vehicleId: string, @Param('id') id: string): Promise<void> {
    return this.remindersService.delete(vehicleId, id);
  }
}
