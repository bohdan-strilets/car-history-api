import { CryptoModule } from '@common/crypto';
import { AppConfigModule } from '@config/config.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { AuthCredentialsRepo } from './auth-credentials.repository';
import { EmailVerifyTokenRepo } from './email-verify-token.repository';
import { PasswordResetTokenRepo } from './password-reset-token.repository';
import { UserSettingsRepo } from './user-settings.repository';
import { UsersRepo } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, AppConfigModule, CryptoModule],
  providers: [
    UsersService,
    UsersRepo,
    AuthCredentialsRepo,
    EmailVerifyTokenRepo,
    PasswordResetTokenRepo,
    UserSettingsRepo,
  ],
  exports: [UsersService],
})
export class UsersModule {}
