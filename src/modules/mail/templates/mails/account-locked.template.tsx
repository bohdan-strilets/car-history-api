import {
  BaseLayout,
  EmailButtonSection,
  EmailDivider,
  EmailHeading,
  EmailText,
} from '../components';
import { AccountLockedProps } from '../props.types';
import { formatDate } from '../utils';

export const AccountLockedTemplate = ({ firstName, lockedUntil, resetUrl }: AccountLockedProps) => {
  const formattedDate = formatDate(lockedUntil);

  return (
    <BaseLayout preview="Konto zostało tymczasowo zablokowane — Arvino">
      <EmailHeading>Konto tymczasowo zablokowane</EmailHeading>

      <EmailText>
        Cześć, {firstName}! Twoje konto zostało tymczasowo zablokowane z powodu zbyt wielu
        nieudanych prób logowania.
      </EmailText>

      <EmailText>Konto zostanie odblokowane automatycznie o {formattedDate}.</EmailText>

      <EmailText>Jeśli to nie Ty próbowałeś się logować, zresetuj hasło natychmiast.</EmailText>

      <EmailButtonSection href={resetUrl}>Resetuj hasło</EmailButtonSection>

      <EmailDivider />

      <EmailText muted>
        Jeśli to Ty próbowałeś się zalogować, poczekaj do {formattedDate} i spróbuj ponownie.
      </EmailText>
    </BaseLayout>
  );
};
