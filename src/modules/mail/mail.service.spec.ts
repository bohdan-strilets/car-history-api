import { AppConfigService } from '@config/config.service';
import { render } from '@react-email/render';
import { Resend } from 'resend';

import { MailService } from './mail.service';
import {
  ConfirmEmailTemplate,
  ReminderNotificationTemplate,
  ResetPasswordTemplate,
  WorkspaceInviteTemplate,
} from './templates';

jest.mock('@react-email/render', () => ({
  render: jest.fn(),
}));

jest.mock('./templates', () => ({
  ConfirmEmailTemplate: jest.fn(),
  WelcomeTemplate: jest.fn(),
  ResetPasswordTemplate: jest.fn(),
  PasswordChangedTemplate: jest.fn(),
  AccountLockedTemplate: jest.fn(),
  EmailChangedTemplate: jest.fn(),
  NewDeviceLoginTemplate: jest.fn(),
  WorkspaceInviteTemplate: jest.fn(),
  ReminderNotificationTemplate: jest.fn(),
}));

jest.mock('resend', () => ({
  Resend: jest.fn(),
}));

describe('MailService', () => {
  let service: MailService;
  let config: jest.Mocked<AppConfigService>;
  let sendMock: jest.Mock;

  beforeEach(() => {
    sendMock = jest.fn().mockResolvedValue({ id: 'email-id' });
    (Resend as unknown as jest.Mock).mockImplementation(() => ({
      emails: { send: sendMock },
    }));

    config = {
      resendApiKey: 'resend-key',
      mailFrom: 'noreply@arvino.test',
    } as unknown as jest.Mocked<AppConfigService>;

    service = new MailService(config);

    jest.spyOn(service['logger'], 'error').mockImplementation(() => undefined);
    (render as jest.Mock).mockResolvedValue('<html>ok</html>');
    (ConfirmEmailTemplate as jest.Mock).mockReturnValue('confirm-template');
    (ResetPasswordTemplate as jest.Mock).mockReturnValue('reset-template');
    (WorkspaceInviteTemplate as jest.Mock).mockReturnValue('workspace-template');
    (ReminderNotificationTemplate as jest.Mock).mockReturnValue('reminder-template');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sendConfirmEmail: рендерить шаблон і відправляє email', async () => {
    await service.sendConfirmEmail({
      to: 'user@example.com',
      firstName: 'John',
      confirmUrl: 'https://app/confirm',
    });

    expect(ConfirmEmailTemplate).toHaveBeenCalledWith({
      firstName: 'John',
      confirmUrl: 'https://app/confirm',
    });
    expect(render).toHaveBeenCalledWith('confirm-template');
    expect(sendMock).toHaveBeenCalledWith({
      from: 'noreply@arvino.test',
      to: 'user@example.com',
      subject: 'Potwierdź swój adres email — Arvino',
      html: '<html>ok</html>',
    });
  });

  it('sendResetPassword: передає expiresInMinutes у шаблон', async () => {
    await service.sendResetPassword({
      to: 'user@example.com',
      firstName: 'John',
      resetUrl: 'https://app/reset',
      expiresInMinutes: 20,
    });

    expect(ResetPasswordTemplate).toHaveBeenCalledWith({
      firstName: 'John',
      resetUrl: 'https://app/reset',
      expiresInMinutes: 20,
    });
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Resetowanie hasła — Arvino',
      }),
    );
  });

  it('sendWorkspaceInvite: формує subject з назвою workspace', async () => {
    await service.sendWorkspaceInvite({
      to: 'member@example.com',
      firstName: 'Kate',
      invitedByName: 'Owner Name',
      workspaceName: 'Team Space',
      role: 'MEMBER',
      inviteUrl: 'https://app/invite',
    });

    expect(WorkspaceInviteTemplate).toHaveBeenCalledWith({
      firstName: 'Kate',
      invitedByName: 'Owner Name',
      workspaceName: 'Team Space',
      role: 'MEMBER',
      inviteUrl: 'https://app/invite',
    });
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'member@example.com',
        subject: 'Zaproszenie do workspace Team Space — Arvino',
      }),
    );
  });

  it('sendReminderNotification: рендерить reminder шаблон і відправляє', async () => {
    await service.sendReminderNotification({
      to: 'user@example.com',
      firstName: 'John',
      reminderTitle: 'Oil change',
      dueDate: '2026-07-01',
      daysLeft: 7,
      vehicleName: 'BMW X5',
    });

    expect(ReminderNotificationTemplate).toHaveBeenCalledWith({
      firstName: 'John',
      reminderTitle: 'Oil change',
      dueDate: '2026-07-01',
      daysLeft: 7,
      vehicleName: 'BMW X5',
    });
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Przypomnienie: Oil change — Arvino',
      }),
    );
  });

  it('не кидає помилку якщо Resend повертає виняток і логує її', async () => {
    sendMock.mockRejectedValueOnce(new Error('Resend unavailable'));

    await expect(
      service.sendConfirmEmail({
        to: 'user@example.com',
        firstName: 'John',
        confirmUrl: 'https://app/confirm',
      }),
    ).resolves.toBeUndefined();

    expect(service['logger'].error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to send email to user@example.com'),
    );
  });
});
