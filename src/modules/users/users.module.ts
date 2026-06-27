import { CryptoModule } from '@common/crypto';
import { AppConfigModule } from '@config/config.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { AuthCredentialsRepo } from './auth-credentials.repository';
import { AvatarUploadService } from './avatar-upload.service';
import { EmailVerifyTokenRepo } from './email-verify-token.repository';
import { PasswordResetTokenRepo } from './password-reset-token.repository';
import { UserSettingsRepo } from './user-settings.repository';
import { UsersController } from './users.controller';
import { UsersRepo } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, AppConfigModule, CryptoModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepo,
    AuthCredentialsRepo,
    EmailVerifyTokenRepo,
    PasswordResetTokenRepo,
    UserSettingsRepo,
    AvatarUploadService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
