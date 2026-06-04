import { WorkspaceMemberGuard } from '@common/guards';
import { AiModule } from '@modules/ai';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { VehiclesController } from './vehicles.controller';
import { VehiclesRepo } from './vehicles.repository';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, VehiclesRepo, WorkspaceMemberGuard],
  exports: [VehiclesService],
})
export class VehiclesModule {}
