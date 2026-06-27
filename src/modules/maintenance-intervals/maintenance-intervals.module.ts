import { VehicleAccessGuard, WorkspaceMemberGuard } from '@common/guards';
import { RemindersModule } from '@modules/reminders';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { MaintenanceIntervalsController } from './maintenance-intervals.controller';
import { MaintenanceIntervalsRepository } from './maintenance-intervals.repository';
import { MaintenanceIntervalsService } from './maintenance-intervals.service';

@Module({
  imports: [PrismaModule, RemindersModule],
  controllers: [MaintenanceIntervalsController],
  providers: [
    MaintenanceIntervalsService,
    MaintenanceIntervalsRepository,
    WorkspaceMemberGuard,
    VehicleAccessGuard,
  ],
  exports: [MaintenanceIntervalsService],
})
export class MaintenanceIntervalsModule {}
