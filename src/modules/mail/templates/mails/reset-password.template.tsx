import {
  BaseLayout,
  EmailButtonSection,
  EmailDivider,
  EmailHeading,
  EmailText,
  EmailUrlText,
} from '../components';
import { ResetPasswordProps } from '../props.types';

export const ResetPasswordTemplate = ({
  firstName,
  resetUrl,
  expiresInMinutes,
}: ResetPasswordProps) => {
  return (
    <BaseLayout preview="Resetowanie hasła — Arvino">
      <EmailHeading>Resetowanie hasła</EmailHeading>

      <EmailText>
        Cześć, {firstName}! Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta Arvino.
      </EmailText>

      <EmailButtonSection href={resetUrl}>Resetuj hasło</EmailButtonSection>

      <EmailDivider />

      <EmailText muted>
        Link jest ważny przez {expiresInMinutes} minut. Jeśli nie prosiłeś o reset hasła, zignoruj
        tę wiadomość — Twoje hasło pozostanie bez zmian.
      </EmailText>

      <EmailText muted>
        Jeśli przycisk nie działa, skopiuj i wklej poniższy link do przeglądarki:
      </EmailText>

      <EmailUrlText url={resetUrl} />
    </BaseLayout>
  );
};
