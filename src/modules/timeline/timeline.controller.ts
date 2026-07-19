import { Auth, CurrentUserId, WorkspaceMember } from '@common/decorators';
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
  Query,
  UseGuards,
} from '@nestjs/common';

import { CreateTimelineEventDto, TimelineQueryDto, UpdateTimelineEventDto } from './dto';
import { TimelineService } from './timeline.service';

@Controller('workspaces/:workspaceId/vehicles/:vehicleId/timeline')
@Auth()
@WorkspaceMember()
@UseGuards(VehicleAccessGuard)
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get()
  getTimeline(@Param('vehicleId') vehicleId: string, @Query() query: TimelineQueryDto) {
    return this.timelineService.getTimeline(vehicleId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createEvent(
    @Param('vehicleId') vehicleId: string,
    @Body() dto: CreateTimelineEventDto,
    @CurrentUserId() userId: string,
  ) {
    return this.timelineService.createEvent(vehicleId, dto, userId);
  }

  @Get(':eventId')
  getEvent(@Param('vehicleId') vehicleId: string, @Param('eventId') eventId: string) {
    return this.timelineService.getEvent(vehicleId, eventId);
  }

  @Patch(':eventId')
  updateEvent(
    @Param('vehicleId') vehicleId: string,
    @Param('eventId') eventId: string,
    @Body() dto: UpdateTimelineEventDto,
  ) {
    return this.timelineService.updateEvent(vehicleId, eventId, dto);
  }

  @Delete(':eventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteEvent(@Param('vehicleId') vehicleId: string, @Param('eventId') eventId: string) {
    return this.timelineService.deleteEvent(vehicleId, eventId);
  }
}
