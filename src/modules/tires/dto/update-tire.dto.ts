import { PartialType } from '@nestjs/mapped-types';
import { TireStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

import { CreateTireDto } from './create-tire.dto';

export class UpdateTireDto extends PartialType(CreateTireDto) {
  @IsOptional()
  @IsEnum(TireStatus)
  status?: TireStatus;
}
