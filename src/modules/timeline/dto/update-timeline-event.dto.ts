import { TimelineConstraints as C } from '@common/validation';
import {
  IsDateString,
  IsDecimal,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateTimelineEventDto {
  @IsOptional()
  @IsString()
  @MinLength(C.TITLE_MIN)
  @MaxLength(C.TITLE_MAX)
  declare title?: string;

  @IsOptional()
  @IsDateString()
  declare eventDate?: string;

  @IsOptional()
  @IsInt()
  @Min(C.MILEAGE_MIN)
  @Max(C.MILEAGE_MAX)
  declare mileage?: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  declare cost?: string;

  @IsOptional()
  @IsString()
  @MaxLength(C.DESCRIPTION_MAX)
  declare description?: string;

  @IsOptional()
  @IsString()
  declare serviceStationId?: string;
}
