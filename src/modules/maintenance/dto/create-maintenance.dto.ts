import { MaintenanceType } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateMaintenanceDto {
  @IsEnum(MaintenanceType)
  declare type: MaintenanceType;

  @IsString()
  declare title: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  declare intervalKm?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  declare intervalMonths?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  declare lastServiceMileage?: number;

  @IsOptional()
  @IsDateString()
  declare lastServiceDate?: string;
}
