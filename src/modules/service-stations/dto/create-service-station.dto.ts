import { ServiceStationType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ServiceStationAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  declare country: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  declare city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  declare street: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  declare number: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postCode?: string;

  [key: string]: string | undefined;
}

export class CreateServiceStationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  declare name: string;

  @IsEnum(ServiceStationType)
  declare type: ServiceStationType;

  @ValidateNested()
  @Type(() => ServiceStationAddressDto)
  declare address: ServiceStationAddressDto;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  googlePlaceId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  googleRating?: number;
}
