import {
  BaseLayout,
  EmailButtonSection,
  EmailDivider,
  EmailHeading,
  EmailText,
  EmailUrlText,
} from '../components';
import type { WorkspaceInviteProps } from '../props.types';

export const WorkspaceInviteTemplate = ({
  firstName,
  invitedByName,
  workspaceName,
  role,
  inviteUrl,
}: WorkspaceInviteProps) => {
  return (
    <BaseLayout preview={`Zaproszenie do workspace ${workspaceName} — Arvino`}>
      <EmailHeading>Masz nowe zaproszenie! 🎉</EmailHeading>

      <EmailText>
        Cześć, {firstName}! <strong>{invitedByName}</strong> zaprosił Cię do workspace{' '}
        <strong>{workspaceName}</strong> jako <strong>{role}</strong>.
      </EmailText>

      <EmailText>Kliknij przycisk poniżej, aby zaakceptować zaproszenie.</EmailText>

      <EmailButtonSection href={inviteUrl}>Akceptuj zaproszenie</EmailButtonSection>

      <EmailDivider />

      <EmailText muted>
        Link jest ważny przez 7 dni. Jeśli nie chcesz dołączyć, zignoruj tę wiadomość.
      </EmailText>

      <EmailText muted>
        Jeśli przycisk nie działa, skopiuj i wklej poniższy link do przeglądarki:
      </EmailText>

      <EmailUrlText url={inviteUrl} />
    </BaseLayout>
  );
};
