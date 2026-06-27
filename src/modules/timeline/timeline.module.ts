import { VehicleAccessGuard, WorkspaceMemberGuard } from '@common/guards';
import { MilestonesModule } from '@modules/milestones';
import { RemindersModule } from '@modules/reminders';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { TimelineController } from './timeline.controller';
import { TimelineRepository } from './timeline.repository';
import { TimelineService } from './timeline.service';

@Module({
  imports: [PrismaModule, MilestonesModule, RemindersModule],
  controllers: [TimelineController],
  providers: [TimelineService, TimelineRepository, WorkspaceMemberGuard, VehicleAccessGuard],
  exports: [TimelineService],
})
export class TimelineModule {}
