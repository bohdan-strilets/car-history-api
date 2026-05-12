export type MailParams = {
  to: string;
  subject: string;
  html: string;
};

export type ConfirmEmailParams = {
  to: string;
  firstName: string;
  confirmUrl: string;
};

export type WelcomeParams = {
  to: string;
  firstName: string;
  dashboardUrl: string;
};

export type ResetPasswordParams = {
  to: string;
  firstName: string;
  resetUrl: string;
  expiresInMinutes: number;
};

export type PasswordChangedParams = {
  to: string;
  firstName: string;
  resetUrl: string;
  changedAt: Date;
};

export type AccountLockedParams = {
  to: string;
  firstName: string;
  lockedUntil: Date;
  resetUrl: string;
};

export type EmailChangedParams = {
  to: string;
  firstName: string;
  newEmail: string;
  resetUrl: string;
  changedAt: Date;
};

export type NewDeviceLoginParams = {
  to: string;
  firstName: string;
  deviceName: string;
  ipAddress: string;
  loginAt: Date;
  resetUrl: string;
};
