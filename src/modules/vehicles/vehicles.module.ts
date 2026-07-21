import { VehicleAccessGuard, WorkspaceMemberGuard } from '@common/guards';
import { AiModule } from '@modules/ai';
import { MaintenanceModule } from '@modules/maintenance';
import { MediaModule } from '@modules/media';
import { MilestonesModule } from '@modules/milestones';
import { RemindersModule } from '@modules/reminders';
import { TimelineModule } from '@modules/timeline';
import { TiresModule } from '@modules/tires';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { VehiclesController } from './vehicles.controller';
import { VehiclesRepo } from './vehicles.repository';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    TimelineModule,
    RemindersModule,
    MaintenanceModule,
    TiresModule,
    MilestonesModule,
    MediaModule,
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService, VehiclesRepo, WorkspaceMemberGuard, VehicleAccessGuard],
  exports: [VehiclesService],
})
export class VehiclesModule {}
