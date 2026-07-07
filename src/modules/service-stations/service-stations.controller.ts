import { Auth, CurrentUserId, EmailVerified } from '@common/decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateServiceStationDto, ServiceStationResponseDto, UpdateServiceStationDto } from './dto';
import { ServiceStationsService } from './service-stations.service';

@Controller('service-stations')
@Auth()
export class ServiceStationsController {
  constructor(private readonly serviceStationsService: ServiceStationsService) {}

  @Get()
  getAll(@CurrentUserId() userId: string): Promise<ServiceStationResponseDto[]> {
    return this.serviceStationsService.getAllByUserId(userId);
  }

  @Get(':id')
  getById(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<ServiceStationResponseDto> {
    return this.serviceStationsService.getById(userId, id);
  }

  @Post()
  @EmailVerified()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateServiceStationDto,
  ): Promise<ServiceStationResponseDto> {
    return this.serviceStationsService.create(userId, dto);
  }

  @Patch(':id')
  @EmailVerified()
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceStationDto,
  ): Promise<ServiceStationResponseDto> {
    return this.serviceStationsService.update(userId, id, dto);
  }

  @Patch(':id/favorite')
  @EmailVerified()
  toggleFavorite(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<ServiceStationResponseDto> {
    return this.serviceStationsService.toggleFavorite(userId, id);
  }

  @Delete(':id')
  @EmailVerified()
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUserId() userId: string, @Param('id') id: string): Promise<void> {
    return this.serviceStationsService.delete(userId, id);
  }
}
