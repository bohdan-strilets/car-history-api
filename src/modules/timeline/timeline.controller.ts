import { Auth, CurrentUserId, WorkspaceMember } from '@common/decorators';
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
} from '@nestjs/common';

import { CreateTimelineEventDto, TimelineQueryDto, UpdateTimelineEventDto } from './dto';
import { TimelineService } from './timeline.service';

@Controller('workspaces/:workspaceId/vehicles/:vehicleId/timeline')
@Auth()
@WorkspaceMember()
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
  getEvent(@Param('eventId') eventId: string) {
    return this.timelineService.getEvent(eventId);
  }

  @Patch(':eventId')
  updateEvent(@Param('eventId') eventId: string, @Body() dto: UpdateTimelineEventDto) {
    return this.timelineService.updateEvent(eventId, dto);
  }

  @Delete(':eventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteEvent(@Param('eventId') eventId: string) {
    return this.timelineService.deleteEvent(eventId);
  }
}
