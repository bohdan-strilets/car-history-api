import {
  Auth,
  CurrentUserId,
  CurrentWorkspaceMember,
  EmailVerified,
  WorkspaceMember,
} from '@common/decorators';
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
import { WorkspaceMember as WorkspaceMemberEntity } from '@prisma/client';

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
    @CurrentUserId() userId: string,
  ): Promise<ReminderResponseDto> {
    return this.remindersService.create(vehicleId, dto, userId);
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
  delete(
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
    @CurrentWorkspaceMember() member: WorkspaceMemberEntity,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    return this.remindersService.delete(vehicleId, id, member.role, userId);
  }
}
