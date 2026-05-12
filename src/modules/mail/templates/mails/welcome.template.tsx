import {
  BaseLayout,
  EmailButtonSection,
  EmailDivider,
  EmailHeading,
  EmailText,
} from '../components';
import { WelcomeProps } from '../props.types';

export const WelcomeTemplate = ({ firstName, dashboardUrl }: WelcomeProps) => {
  return (
    <BaseLayout preview="Witaj w Arvino! 🚗">
      <EmailHeading>Witaj w Arvino, {firstName}! 🚗</EmailHeading>

      <EmailText>
        Twój adres email został potwierdzony. Jesteś gotowy, aby zacząć korzystać z cyfrowego
        paszportu swojego samochodu.
      </EmailText>

      <EmailText>Z Arvino możesz:</EmailText>

      <EmailText>🔧 Śledzić historię serwisową swojego auta</EmailText>
      <EmailText>💸 Kontrolować wszystkie wydatki</EmailText>
      <EmailText>📄 Przechowywać dokumenty i otrzymywać przypomnienia o OC/AC</EmailText>
      <EmailText>🤖 Korzystać z asystenta AI</EmailText>

      <EmailButtonSection href={dashboardUrl}>Przejdź do aplikacji</EmailButtonSection>

      <EmailDivider />

      <EmailText muted>Masz pytania? Napisz do nas na support@arvino.app</EmailText>
    </BaseLayout>
  );
};
