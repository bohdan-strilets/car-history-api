import { Auth, EmailVerified, WorkspaceMember } from '@common/decorators';
import { VehicleAccessGuard } from '@common/guards';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CreateTireDto, TireResponseDto } from './dto';
import { TiresService } from './tires.service';

@Controller('workspaces/:workspaceId/vehicles/:vehicleId/tires')
@Auth()
@WorkspaceMember()
@UseGuards(VehicleAccessGuard)
export class TiresController {
  constructor(private readonly tiresService: TiresService) {}

  @Get()
  getAll(@Param('vehicleId') vehicleId: string): Promise<TireResponseDto[]> {
    return this.tiresService.getAllByVehicleId(vehicleId);
  }

  @Post()
  @EmailVerified()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('vehicleId') vehicleId: string,
    @Body() dto: CreateTireDto,
  ): Promise<TireResponseDto> {
    return this.tiresService.create(vehicleId, dto);
  }
}
