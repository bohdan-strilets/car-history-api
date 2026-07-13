// Components

export interface BaseLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
}

export interface EmailHeadingProps {
  children: React.ReactNode;
}

export interface EmailTextProps {
  children: React.ReactNode;
  muted?: boolean;
}

export interface EmailUrlTextProps {
  url: string;
}

export interface EmailButtonSectionProps {
  href: string;
  children: React.ReactNode;
}

// Templates

export interface ConfirmEmailProps {
  firstName: string;
  confirmUrl: string;
}

export interface ResetPasswordProps {
  firstName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface WelcomeProps {
  firstName: string;
  dashboardUrl: string;
}

export interface PasswordChangedProps {
  firstName: string;
  resetUrl: string;
  changedAt: Date;
}

export interface AccountLockedProps {
  firstName: string;
  lockedUntil: Date;
  resetUrl: string;
}

export interface EmailChangedProps {
  firstName: string;
  newEmail: string;
  resetUrl: string;
  changedAt: Date;
}

export interface NewDeviceLoginProps {
  firstName: string;
  deviceName: string;
  ipAddress: string;
  loginAt: Date;
  resetUrl: string;
}

export interface WorkspaceInviteProps {
  firstName: string;
  invitedByName: string;
  workspaceName: string;
  role: string;
  inviteUrl: string;
}

export interface ReminderNotificationProps {
  firstName: string;
  reminderTitle: string;
  dueDate: string;
  daysLeft: number;
  vehicleName: string;
}

export interface ConfirmEmailChangeProps {
  firstName: string;
  newEmail: string;
  confirmUrl: string;
}
