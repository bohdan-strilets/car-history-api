import { Language, Theme } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsEnum(Language)
  declare language?: Language;

  @IsOptional()
  @IsEnum(Theme)
  declare theme?: Theme;

  @IsOptional()
  @IsBoolean()
  declare notificationsEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  declare notificationsPush?: boolean;
}
