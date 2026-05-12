import { EmailUrlTextProps } from '../props.types';
import { colors, fontSize } from '../styles';

export const EmailUrlText = ({ url }: EmailUrlTextProps) => {
  return (
    <p
      style={{
        fontSize: fontSize.sm,
        color: colors.textMuted,
        wordBreak: 'break-all',
        margin: 0,
      }}
    >
      {url}
    </p>
  );
};
