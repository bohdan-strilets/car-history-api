import { BaseLayout, EmailDivider, EmailHeading, EmailText } from '../components';
import { ReminderNotificationProps } from '../props.types';

export const ReminderNotificationTemplate = ({
  firstName,
  reminderTitle,
  dueDate,
  daysLeft,
  vehicleName,
}: ReminderNotificationProps) => {
  const urgencyText =
    daysLeft === 1 ? 'jutro!' : daysLeft === 0 ? 'dzisiaj!' : `za ${daysLeft} dni`;

  return (
    <BaseLayout preview={`Przypomnienie: ${reminderTitle} — Arvino`}>
      <EmailHeading>Przypomnienie o terminie ⏰</EmailHeading>
      <EmailText>
        Cześć, {firstName}! Masz zbliżający się termin dla pojazdu <strong>{vehicleName}</strong>.
      </EmailText>
      <EmailText>
        <strong>{reminderTitle}</strong> — termin upływa <strong>{urgencyText}</strong> ({dueDate}).
      </EmailText>
      <EmailDivider />
      <EmailText muted>Zaloguj się do Arvino, aby zarządzać swoimi przypomnieniami.</EmailText>
    </BaseLayout>
  );
};
