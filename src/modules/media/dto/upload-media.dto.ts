import { MediaCategory, MediaEntity } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class UploadMediaDto {
  @IsEnum(MediaEntity)
  declare entityType: MediaEntity;

  @IsString()
  declare entityId: string;

  @IsEnum(MediaCategory)
  declare category: MediaCategory;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPrimary?: boolean = false;
}
