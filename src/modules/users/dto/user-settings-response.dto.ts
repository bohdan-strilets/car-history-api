import { Language, Theme } from '@prisma/client';

export class UserSettingsResponseDto {
  declare language: Language;
  declare theme: Theme;
  declare notificationsEmail: boolean;
  declare notificationsPush: boolean;
}
