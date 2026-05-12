import { Button } from '@react-email/components';

import { EmailButtonProps } from '../props.types';
import { colors, fontSize, fontWeight, radius, spacing } from '../styles';

export const EmailButton = ({ href, children }: EmailButtonProps) => {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: colors.accent,
        borderRadius: radius.md,
        color: colors.white,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        padding: `${spacing.md} ${spacing['2xl']}`,
        textDecoration: 'none',
        display: 'inline-block',
      }}
    >
      {children}
    </Button>
  );
};
