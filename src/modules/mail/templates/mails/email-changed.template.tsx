import {
  BaseLayout,
  EmailButtonSection,
  EmailDivider,
  EmailHeading,
  EmailText,
} from '../components';
import { EmailChangedProps } from '../props.types';
import { formatDate } from '../utils';

export const EmailChangedTemplate = ({
  firstName,
  newEmail,
  resetUrl,
  changedAt,
}: EmailChangedProps) => {
  const formattedDate = formatDate(changedAt);

  return (
    <BaseLayout preview="Adres email został zmieniony — Arvino">
      <EmailHeading>Adres email został zmieniony</EmailHeading>

      <EmailText>
        Cześć, {firstName}! Adres email Twojego konta Arvino został zmieniony na{' '}
        <strong>{newEmail}</strong> dnia {formattedDate}.
      </EmailText>

      <EmailText>Jeśli to nie Ty dokonałeś tej zmiany, natychmiast zresetuj hasło.</EmailText>

      <EmailButtonSection href={resetUrl}>To nie ja — resetuj hasło</EmailButtonSection>

      <EmailDivider />

      <EmailText muted>
        Ta wiadomość została wysłana na poprzedni adres email jako powiadomienie o zmianie.
      </EmailText>
    </BaseLayout>
  );
};
