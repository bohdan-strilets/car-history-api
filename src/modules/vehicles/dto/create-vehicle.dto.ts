import { VehicleConstraints } from '@common/validation';
import { BodyType, DriveType, FuelType, Transmission } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @MinLength(VehicleConstraints.BRAND_MIN)
  @MaxLength(VehicleConstraints.BRAND_MAX)
  declare brand: string;

  @IsString()
  @MinLength(VehicleConstraints.MODEL_MIN)
  @MaxLength(VehicleConstraints.MODEL_MAX)
  declare model: string;

  @IsInt()
  @Min(VehicleConstraints.YEAR_MIN)
  @Max(new Date().getFullYear())
  declare year: number;

  @IsOptional()
  @IsString()
  @MaxLength(VehicleConstraints.GENERATION_MAX)
  declare generation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(VehicleConstraints.NICKNAME_MAX)
  declare nickname?: string;

  @IsOptional()
  @IsString()
  declare vin?: string;

  @IsString()
  @MinLength(VehicleConstraints.PLATE_NUMBER_MIN)
  @MaxLength(VehicleConstraints.PLATE_NUMBER_MAX)
  declare plateNumber: string;

  @IsInt()
  @Min(VehicleConstraints.ENGINE_DISPLACEMENT_MIN)
  @Max(VehicleConstraints.ENGINE_DISPLACEMENT_MAX)
  declare engineDisplacementCc: number;

  @IsEnum(BodyType)
  declare bodyType: BodyType;

  @IsArray()
  @IsEnum(FuelType, { each: true })
  declare fuelType: FuelType[];

  @IsEnum(Transmission)
  declare transmission: Transmission;

  @IsEnum(DriveType)
  declare driveType: DriveType;

  @IsString()
  @MaxLength(VehicleConstraints.COLOR_MAX)
  declare color: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  declare currentMileage?: number;

  @IsOptional()
  @IsString()
  @MaxLength(VehicleConstraints.DESCRIPTION_MAX)
  declare description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(VehicleConstraints.COUNTRY_MAX)
  declare countryOfOrigin?: string;
}
