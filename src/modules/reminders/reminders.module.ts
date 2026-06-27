import { VehicleAccessGuard, WorkspaceMemberGuard } from '@common/guards';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { RemindersController } from './reminders.controller';
import { RemindersRepository } from './reminders.repository';
import { RemindersService } from './reminders.service';

@Module({
  imports: [PrismaModule],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersRepository, WorkspaceMemberGuard, VehicleAccessGuard],
  exports: [RemindersService],
})
export class RemindersModule {}
