import {
  BaseLayout,
  EmailButtonSection,
  EmailDivider,
  EmailHeading,
  EmailText,
} from '../components';
import { NewDeviceLoginProps } from '../props.types';
import { formatDate } from '../utils';

export const NewDeviceLoginTemplate = ({
  firstName,
  deviceName,
  ipAddress,
  loginAt,
  resetUrl,
}: NewDeviceLoginProps) => {
  const formattedDate = formatDate(loginAt);

  return (
    <BaseLayout preview="Nowe logowanie do konta — Arvino">
      <EmailHeading>Nowe logowanie do konta</EmailHeading>

      <EmailText>Cześć, {firstName}! Wykryliśmy nowe logowanie do Twojego konta Arvino.</EmailText>

      <EmailText>📱 Urządzenie: {deviceName}</EmailText>
      <EmailText>🌐 Adres IP: {ipAddress}</EmailText>
      <EmailText>🕐 Data: {formattedDate}</EmailText>

      <EmailText>Jeśli to nie Ty się zalogowałeś, natychmiast zresetuj hasło.</EmailText>

      <EmailButtonSection href={resetUrl}>To nie ja — resetuj hasło</EmailButtonSection>

      <EmailDivider />

      <EmailText muted>Jeśli to Ty się zalogowałeś, możesz zignorować tę wiadomość.</EmailText>
    </BaseLayout>
  );
};
