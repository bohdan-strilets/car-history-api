import { User, UserSettings } from '@prisma/client';

import { UserProfileResponseDto, UserResponseDto, UserSettingsResponseDto } from '../dto';

export const toUserResponse = (user: User): UserResponseDto => {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    status: user.status,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt,
  };
};

export const toUserSettingsResponse = (settings: UserSettings): UserSettingsResponseDto => {
  return {
    language: settings.language,
    theme: settings.theme,
    notificationsEmail: settings.notificationsEmail,
    notificationsPush: settings.notificationsPush,
  };
};

export const toUserProfileResponse = (
  user: User,
  settings: UserSettings,
): UserProfileResponseDto => {
  return {
    ...toUserResponse(user),
    settings: toUserSettingsResponse(settings),
  };
};
