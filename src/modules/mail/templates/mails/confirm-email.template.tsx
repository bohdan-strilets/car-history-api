import {
  BaseLayout,
  EmailButtonSection,
  EmailDivider,
  EmailHeading,
  EmailText,
  EmailUrlText,
} from '../components';
import { ConfirmEmailProps } from '../props.types';

export const ConfirmEmailTemplate = ({ firstName, confirmUrl }: ConfirmEmailProps) => {
  return (
    <BaseLayout preview="Potwierdź swój adres email — Arvino">
      <EmailHeading>Cześć, {firstName}! 👋</EmailHeading>

      <EmailText>
        Dziękujemy za rejestrację w Arvino. Kliknij przycisk poniżej, aby potwierdzić swój adres
        email i aktywować konto.
      </EmailText>

      <EmailButtonSection href={confirmUrl}>Potwierdź email</EmailButtonSection>

      <EmailDivider />

      <EmailText muted>
        Link jest ważny przez 24 godziny. Jeśli nie zakładałeś konta w Arvino, zignoruj tę
        wiadomość.
      </EmailText>

      <EmailText muted>
        Jeśli przycisk nie działa, skopiuj i wklej poniższy link do przeglądarki:
      </EmailText>

      <EmailUrlText url={confirmUrl} />
    </BaseLayout>
  );
};
