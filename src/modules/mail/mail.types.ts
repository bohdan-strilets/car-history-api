export interface MailParams {
  to: string;
  subject: string;
  html: string;
}

export interface BaseTemplateParams {
  firstName: string;
  to: string;
}

export interface ConfirmEmailParams extends BaseTemplateParams {
  confirmUrl: string;
}

export interface WelcomeParams extends BaseTemplateParams {
  dashboardUrl: string;
}

export interface ResetPasswordParams extends BaseTemplateParams {
  resetUrl: string;
  expiresInMinutes: number;
}

export interface PasswordChangedParams extends BaseTemplateParams {
  resetUrl: string;
  changedAt: Date;
}

export interface AccountLockedParams extends BaseTemplateParams {
  lockedUntil: Date;
  resetUrl: string;
}

export interface EmailChangedParams extends BaseTemplateParams {
  newEmail: string;
  resetUrl: string;
  changedAt: Date;
}

export interface NewDeviceLoginParams extends BaseTemplateParams {
  deviceName: string;
  ipAddress: string;
  loginAt: Date;
  resetUrl: string;
}

export interface WorkspaceInviteParams extends BaseTemplateParams {
  invitedByName: string;
  workspaceName: string;
  role: string;
  inviteUrl: string;
}

export interface RemovedFromWorkspaceParams extends BaseTemplateParams {
  workspaceName: string;
}

export interface ReminderNotificationParams extends BaseTemplateParams {
  reminderTitle: string;
  dueDate: string;
  daysLeft: number;
  vehicleName: string;
}

export interface ConfirmEmailChangeParams extends BaseTemplateParams {
  newEmail: string;
  confirmUrl: string;
}
