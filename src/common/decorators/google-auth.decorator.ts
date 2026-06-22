import { GoogleAuthGuard } from '@common/guards/google-auth.guard';
import { UseGuards, applyDecorators } from '@nestjs/common';

export const GoogleAuth = () => applyDecorators(UseGuards(GoogleAuthGuard));
