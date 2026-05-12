import { Heading } from '@react-email/components';

import { EmailHeadingProps } from '../props.types';
import { colors, fontSize, fontWeight, spacing } from '../styles';

export const EmailHeading = ({ children }: EmailHeadingProps) => {
  return (
    <Heading
      style={{
        color: colors.textPrimary,
        fontSize: fontSize['2xl'],
        fontWeight: fontWeight.bold,
        margin: `0 0 ${spacing.lg} 0`,
        lineHeight: '1.1',
      }}
    >
      {children}
    </Heading>
  );
};
