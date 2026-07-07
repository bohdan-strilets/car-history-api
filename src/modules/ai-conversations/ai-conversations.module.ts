import { AiModule } from '@modules/ai';
import { MaintenanceModule } from '@modules/maintenance';
import { TimelineModule } from '@modules/timeline';
import { VehiclesModule } from '@modules/vehicles';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { AiConversationsController } from './ai-conversations.controller';
import { AiConversationsRepository } from './ai-conversations.repository';
import { AiConversationsService } from './ai-conversations.service';

@Module({
  imports: [PrismaModule, AiModule, VehiclesModule, TimelineModule, MaintenanceModule],
  controllers: [AiConversationsController],
  providers: [AiConversationsService, AiConversationsRepository],
  exports: [AiConversationsService],
})
export class AiConversationsModule {}
