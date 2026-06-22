import { Hr } from '@react-email/components';

import { colors, spacing } from '../styles';

export function EmailDivider() {
  return (
    <Hr
      style={{
        borderColor: colors.border,
        margin: `${spacing['2xl']} 0`,
      }}
    />
  );
}
