import { Currency, DateFormat, DistanceUnit, FuelUnit } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateWorkspaceSettingsDto {
  @IsOptional()
  @IsEnum(Currency)
  declare currency?: Currency;

  @IsOptional()
  @IsString()
  declare timezone?: string;

  @IsOptional()
  @IsEnum(DistanceUnit)
  declare distanceUnit?: DistanceUnit;

  @IsOptional()
  @IsEnum(FuelUnit)
  declare fuelUnit?: FuelUnit;

  @IsOptional()
  @IsEnum(DateFormat)
  declare dateFormat?: DateFormat;
}
