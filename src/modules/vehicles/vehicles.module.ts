import { WorkspaceMemberGuard } from '@common/guards';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { VehiclesController } from './vehicles.controller';
import { VehiclesRepo } from './vehicles.repository';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [PrismaModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, VehiclesRepo, WorkspaceMemberGuard],
  exports: [VehiclesService],
})
export class VehiclesModule {}
