import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { StatsController } from './stats.controller';
import { StatsRepository } from './stats.repository';
import { StatsService } from './stats.service';

@Module({
  imports: [PrismaModule],
  controllers: [StatsController],
  providers: [StatsService, StatsRepository],
})
export class StatsModule {}
