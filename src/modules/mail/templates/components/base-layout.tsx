import { Body, Container, Head, Html, Img, Preview, Section } from '@react-email/components';

import { BaseLayoutProps } from '../props.types';
import { colors, fontSize, radius, spacing } from '../styles';

export const BaseLayout = ({ preview, children }: BaseLayoutProps) => {
  return (
    <Html lang="pl">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.canvas, fontFamily: "'DM Sans', sans-serif" }}>
        <Container
          style={{
            maxWidth: '580px',
            margin: '0 auto',
            padding: `${spacing['4xl']} ${spacing.lg}`,
          }}
        >
          {/* Logo */}
          <Section style={{ textAlign: 'center', marginBottom: spacing['3xl'] }}>
            <Img
              src="https://res.cloudinary.com/ddd1vgg5b/image/upload/v1778594269/Arvino/dev/pqmzw8scnpysrmct8jgy.png"
              alt="Arvino"
              width={120}
              style={{ margin: '0 auto' }}
            />
          </Section>

          {/* Content */}
          <Section
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: spacing['3xl'],
              border: `1px solid ${colors.border}`,
            }}
          >
            {children}
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: 'center', marginTop: spacing['3xl'] }}>
            <p style={{ fontSize: fontSize.sm, color: colors.textMuted, margin: 0 }}>
              © {new Date().getFullYear()} Arvino. All rights reserved.
            </p>
            <p style={{ fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs }}>
              arvino.app
            </p>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
