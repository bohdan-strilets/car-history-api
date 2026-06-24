import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { MilestonesController } from './milestones.controller';
import { MilestonesCron } from './milestones.cron';
import { MilestonesRepository } from './milestones.repository';
import { MilestonesService } from './milestones.service';

@Module({
  imports: [PrismaModule],
  controllers: [MilestonesController],
  providers: [MilestonesService, MilestonesRepository, MilestonesCron],
  exports: [MilestonesService],
})
export class MilestonesModule {}
