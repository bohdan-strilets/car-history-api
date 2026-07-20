import { BaseLayout, EmailHeading, EmailText } from '../components';
import type { RemovedFromWorkspaceProps } from '../props.types';

export const RemovedFromWorkspaceTemplate = ({
  firstName,
  workspaceName,
}: RemovedFromWorkspaceProps) => {
  return (
    <BaseLayout preview={`Usunięto Cię z workspace ${workspaceName} — Arvino`}>
      <EmailHeading>Zostałeś usunięty z workspace</EmailHeading>
      <EmailText>
        Cześć, {firstName}! Informujemy, że zostałeś usunięty z workspace{' '}
        <strong>{workspaceName}</strong> i nie masz już do niego dostępu.
      </EmailText>
      <EmailText muted>
        Jeśli uważasz, że to pomyłka, skontaktuj się z właścicielem workspace.
      </EmailText>
    </BaseLayout>
  );
};
