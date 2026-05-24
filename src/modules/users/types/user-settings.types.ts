import { Language, Theme } from '@prisma/client';

export type UpdateUserSettingsInput = {
  language?: Language;
  theme?: Theme;
  notificationsEmail?: boolean;
  notificationsPush?: boolean;
};
