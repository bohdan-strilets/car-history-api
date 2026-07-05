import { TireConstraints } from '@common/validation';
import { TireType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTireDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(TireConstraints.BRAND_MIN)
  @MaxLength(TireConstraints.BRAND_MAX)
  declare brand: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(TireConstraints.MODEL_MIN)
  @MaxLength(TireConstraints.MODEL_MAX)
  declare model: string;

  @IsEnum(TireType)
  declare type: TireType;

  @IsInt()
  @Min(TireConstraints.WIDTH_MIN)
  @Max(TireConstraints.WIDTH_MAX)
  declare width: number;

  @IsInt()
  @Min(TireConstraints.ASPECT_RATIO_MIN)
  @Max(TireConstraints.ASPECT_RATIO_MAX)
  declare aspectRatio: number;

  @IsInt()
  @Min(TireConstraints.RIM_DIAMETER_MIN)
  @Max(TireConstraints.RIM_DIAMETER_MAX)
  declare rimDiameter: number;

  @IsOptional()
  @Type(() => Number)
  @Min(TireConstraints.PRICE_MIN)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(TireConstraints.STORAGE_LOCATION_MAX)
  storageLocation?: string;

  @IsOptional()
  @IsInt()
  @Min(TireConstraints.MILEAGE_AT_PURCHASE_MIN)
  mileageAtPurchase?: number;

  @IsOptional()
  @IsInt()
  @Min(TireConstraints.QUANTITY_MIN)
  @Max(TireConstraints.QUANTITY_MAX)
  quantity?: number = TireConstraints.QUANTITY_DEFAULT;

  @IsOptional()
  @IsDateString()
  purchaseAt?: string;
}
