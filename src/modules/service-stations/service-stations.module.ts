import { AppConfigModule } from '@config/config.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { PlacesController } from './places-proxy.controller';
import { PlacesProxyService } from './places-proxy.service';
import { ServiceStationsController } from './service-stations.controller';
import { ServiceStationsRepository } from './service-stations.repository';
import { ServiceStationsService } from './service-stations.service';

@Module({
  imports: [PrismaModule, AppConfigModule],
  controllers: [ServiceStationsController, PlacesController],
  providers: [ServiceStationsService, ServiceStationsRepository, PlacesProxyService],
  exports: [ServiceStationsService],
})
export class ServiceStationsModule {}
