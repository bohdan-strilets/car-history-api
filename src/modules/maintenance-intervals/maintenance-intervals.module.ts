import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { MaintenanceIntervalsController } from './maintenance-intervals.controller';
import { MaintenanceIntervalsRepository } from './maintenance-intervals.repository';
import { MaintenanceIntervalsService } from './maintenance-intervals.service';

@Module({
  imports: [PrismaModule],
  controllers: [MaintenanceIntervalsController],
  providers: [MaintenanceIntervalsService, MaintenanceIntervalsRepository],
  exports: [MaintenanceIntervalsService],
})
export class MaintenanceIntervalsModule {}
