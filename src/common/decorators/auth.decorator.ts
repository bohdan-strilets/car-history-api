import { JwtAuthGuard } from '@common/guards';
import { UseGuards, applyDecorators } from '@nestjs/common';

export const Auth = () => applyDecorators(UseGuards(JwtAuthGuard));
