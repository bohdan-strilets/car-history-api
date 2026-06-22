import { Text } from '@react-email/components';

import { EmailTextProps } from '../props.types';
import { colors, fontSize, spacing } from '../styles';

export const EmailText = ({ children, muted = false }: EmailTextProps) => {
  return (
    <Text
      style={{
        color: muted ? colors.textMuted : colors.textSecondary,
        fontSize: fontSize.md,
        lineHeight: '1.6',
        margin: `0 0 ${spacing.lg} 0`,
      }}
    >
      {children}
    </Text>
  );
};
