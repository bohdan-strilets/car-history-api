import { Section } from '@react-email/components';

import { EmailButtonSectionProps } from '../props.types';
import { spacing } from '../styles';

import { EmailButton } from './button';

export const EmailButtonSection = ({ href, children }: EmailButtonSectionProps) => {
  return (
    <Section style={{ textAlign: 'center', margin: `${spacing['3xl']} 0` }}>
      <EmailButton href={href}>{children}</EmailButton>
    </Section>
  );
};
