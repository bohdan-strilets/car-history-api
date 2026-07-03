import { MediaCategory, MediaEntity, MediaType } from '@prisma/client';

export class MediaVariantDto {
  declare type: string;
  declare cloudinaryUrl: string;
  declare width: number | null;
  declare height: number | null;
}

export class MediaUsageDto {
  declare entityType: MediaEntity;
  declare entityId: string;
  declare category: MediaCategory;
  declare isPrimary: boolean;
}

export class MediaResponseDto {
  declare id: string;
  declare cloudinaryUrl: string;
  declare type: MediaType;
  declare mimeType: string;
  declare width: number | null;
  declare height: number | null;
  declare durationSeconds: number | null;
  declare variants: MediaVariantDto[];
  declare usage: MediaUsageDto;
  declare createdAt: Date;
}
