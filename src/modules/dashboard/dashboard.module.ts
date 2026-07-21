import { RemindersModule } from '@modules/reminders';
import { VehiclesModule } from '@modules/vehicles';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { DashboardController } from './dashboard.controller';
import { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [PrismaModule, VehiclesModule, RemindersModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository],
})
export class DashboardModule {}
