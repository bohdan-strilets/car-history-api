import { AppConfigService } from '@config/config.service';
import { Injectable, Logger } from '@nestjs/common';
import { render } from '@react-email/render';
import { Resend } from 'resend';

import {
  AccountLockedParams,
  ConfirmEmailParams,
  EmailChangedParams,
  MailParams,
  NewDeviceLoginParams,
  PasswordChangedParams,
  ReminderNotificationParams,
  ResetPasswordParams,
  WelcomeParams,
  WorkspaceInviteParams,
} from './mail.types';
import {
  AccountLockedTemplate,
  ConfirmEmailTemplate,
  EmailChangedTemplate,
  NewDeviceLoginTemplate,
  PasswordChangedTemplate,
  ReminderNotificationTemplate,
  ResetPasswordTemplate,
  WelcomeTemplate,
  WorkspaceInviteTemplate,
} from './templates';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: AppConfigService) {
    this.resend = new Resend(this.config.resendApiKey);
  }

  // ─── Core ─────────────────────────────────────────────────────────────────

  private async send({ to, subject, html }: MailParams): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.config.mailFrom,
        to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${String(error)}`);
    }
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────

  async sendConfirmEmail({ to, firstName, confirmUrl }: ConfirmEmailParams): Promise<void> {
    const html = await render(ConfirmEmailTemplate({ firstName, confirmUrl }));
    const subject = 'Potwierdź swój adres email — Arvino';
    await this.send({ to, subject, html });
  }

  async sendWelcome({ to, firstName, dashboardUrl }: WelcomeParams): Promise<void> {
    const html = await render(WelcomeTemplate({ firstName, dashboardUrl }));
    const subject = 'Witaj w Arvino! 🚗';
    await this.send({ to, subject, html });
  }

  async sendResetPassword({
    to,
    firstName,
    resetUrl,
    expiresInMinutes,
  }: ResetPasswordParams): Promise<void> {
    const html = await render(ResetPasswordTemplate({ firstName, resetUrl, expiresInMinutes }));
    const subject = 'Resetowanie hasła — Arvino';
    await this.send({ to, subject, html });
  }

  async sendPasswordChanged({
    to,
    firstName,
    resetUrl,
    changedAt,
  }: PasswordChangedParams): Promise<void> {
    const html = await render(PasswordChangedTemplate({ firstName, resetUrl, changedAt }));
    const subject = 'Hasło zostało zmienione — Arvino';
    await this.send({ to, subject, html });
  }

  async sendAccountLocked({
    to,
    firstName,
    lockedUntil,
    resetUrl,
  }: AccountLockedParams): Promise<void> {
    const html = await render(AccountLockedTemplate({ firstName, lockedUntil, resetUrl }));
    const subject = 'Konto zostało tymczasowo zablokowane — Arvino';
    await this.send({ to, subject, html });
  }

  async sendEmailChanged({
    to,
    firstName,
    newEmail,
    resetUrl,
    changedAt,
  }: EmailChangedParams): Promise<void> {
    const html = await render(EmailChangedTemplate({ firstName, newEmail, resetUrl, changedAt }));
    const subject = 'Adres email został zmieniony — Arvino';
    await this.send({ to, subject, html });
  }

  async sendNewDeviceLogin({
    to,
    firstName,
    deviceName,
    ipAddress,
    loginAt,
    resetUrl,
  }: NewDeviceLoginParams): Promise<void> {
    const html = await render(
      NewDeviceLoginTemplate({ firstName, deviceName, ipAddress, loginAt, resetUrl }),
    );
    const subject = 'Nowe logowanie do konta — Arvino';
    await this.send({ to, subject, html });
  }

  // ─── Workspace ───────────────────────────────────────────────────────────

  async sendWorkspaceInvite({
    to,
    firstName,
    invitedByName,
    workspaceName,
    role,
    inviteUrl,
  }: WorkspaceInviteParams): Promise<void> {
    const html = await render(
      WorkspaceInviteTemplate({ firstName, invitedByName, workspaceName, role, inviteUrl }),
    );
    const subject = `Zaproszenie do workspace ${workspaceName} — Arvino`;
    await this.send({ to, subject, html });
  }

  // ─── Reminders ───────────────────────────────────────────────────────────

  async sendReminderNotification({
    to,
    firstName,
    reminderTitle,
    dueDate,
    daysLeft,
    vehicleName,
  }: ReminderNotificationParams): Promise<void> {
    const html = await render(
      ReminderNotificationTemplate({
        firstName,
        reminderTitle,
        dueDate,
        daysLeft,
        vehicleName,
      }),
    );
    const subject = `Przypomnienie: ${reminderTitle} — Arvino`;
    await this.send({ to, subject, html });
  }
}
