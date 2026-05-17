import { EmailVerifiedGuard } from '@common/guards';
import { applyDecorators, UseGuards } from '@nestjs/common';

export const EmailVerified = () => applyDecorators(UseGuards(EmailVerifiedGuard));
