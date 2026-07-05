import { VehicleAccessGuard, WorkspaceMemberGuard } from '@common/guards';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { TireController } from './tire.controller';
import { TiresController } from './tires.controller';
import { TiresRepository } from './tires.repository';
import { TiresService } from './tires.service';

@Module({
  imports: [PrismaModule],
  controllers: [TiresController, TireController],
  providers: [TiresService, TiresRepository, WorkspaceMemberGuard, VehicleAccessGuard],
  exports: [TiresService],
})
export class TiresModule {}
