import { VehicleAccessGuard, WorkspaceMemberGuard } from '@common/guards';
import { RemindersModule } from '@modules/reminders';
import { TimelineModule } from '@modules/timeline';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { MaintenanceController } from './maintenance.controller';
import { MaintenanceRepository } from './maintenance.repository';
import { MaintenanceService } from './maintenance.service';

@Module({
  imports: [PrismaModule, RemindersModule, TimelineModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceRepository, WorkspaceMemberGuard, VehicleAccessGuard],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
