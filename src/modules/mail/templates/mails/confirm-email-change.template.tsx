import {
  BaseLayout,
  EmailButtonSection,
  EmailDivider,
  EmailHeading,
  EmailText,
  EmailUrlText,
} from '../components';
import { ConfirmEmailChangeProps } from '../props.types';

export const ConfirmEmailChangeTemplate = ({
  firstName,
  newEmail,
  confirmUrl,
}: ConfirmEmailChangeProps) => {
  return (
    <BaseLayout preview="Potwierdź nowy adres email — Arvino">
      <EmailHeading>Cześć, {firstName}! 👋</EmailHeading>

      <EmailText>
        Otrzymaliśmy prośbę o zmianę adresu email na <strong>{newEmail}</strong>. Kliknij przycisk
        poniżej, aby potwierdzić tę zmianę.
      </EmailText>

      <EmailButtonSection href={confirmUrl}>Potwierdź nowy email</EmailButtonSection>

      <EmailDivider />

      <EmailText muted>
        Link jest ważny przez 24 godziny. Jeśli to nie Ty prosiłeś o zmianę adresu email, zignoruj
        tę wiadomość — Twój obecny adres pozostanie aktywny.
      </EmailText>

      <EmailText muted>
        Jeśli przycisk nie działa, skopiuj i wklej poniższy link do przeglądarki:
      </EmailText>

      <EmailUrlText url={confirmUrl} />
    </BaseLayout>
  );
};
