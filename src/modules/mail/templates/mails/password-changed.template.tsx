import {
  BaseLayout,
  EmailButtonSection,
  EmailDivider,
  EmailHeading,
  EmailText,
} from '../components';
import { PasswordChangedProps } from '../props.types';
import { formatDate } from '../utils';

export const PasswordChangedTemplate = ({
  firstName,
  resetUrl,
  changedAt,
}: PasswordChangedProps) => {
  const formattedDate = formatDate(changedAt);

  return (
    <BaseLayout preview="Hasło zostało zmienione — Arvino">
      <EmailHeading>Hasło zostało zmienione</EmailHeading>

      <EmailText>
        Cześć, {firstName}! Twoje hasło do konta Arvino zostało pomyślnie zmienione {formattedDate}.
      </EmailText>

      <EmailText>
        Jeśli to nie Ty zmieniłeś hasło, natychmiast zresetuj je klikając poniższy przycisk.
      </EmailText>

      <EmailButtonSection href={resetUrl}>To nie ja — resetuj hasło</EmailButtonSection>

      <EmailDivider />

      <EmailText muted>Jeśli to Ty zmieniłeś hasło, możesz zignorować tę wiadomość.</EmailText>
    </BaseLayout>
  );
};
