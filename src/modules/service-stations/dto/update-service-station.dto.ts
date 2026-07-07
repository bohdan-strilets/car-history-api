import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { CreateServiceStationDto } from './create-service-station.dto';

export class UpdateServiceStationDto extends PartialType(CreateServiceStationDto) {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  myRating?: number;
}
