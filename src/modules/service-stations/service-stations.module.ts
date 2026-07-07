import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { ServiceStationsController } from './service-stations.controller';
import { ServiceStationsRepository } from './service-stations.repository';
import { ServiceStationsService } from './service-stations.service';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceStationsController],
  providers: [ServiceStationsService, ServiceStationsRepository],
  exports: [ServiceStationsService],
})
export class ServiceStationsModule {}
