import { CryptoModule } from '@common/crypto';
import { AppConfigModule } from '@config/config.module';
import { MailModule } from '@modules/mail';
import { SessionsModule } from '@modules/sessions';
import { WorkspacesModule } from '@modules/workspaces';
import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { AuthCredentialsRepo } from './auth-credentials.repository';
import { EmailChangeTokenRepo } from './email-change-token.repository';
import { EmailVerifyTokenRepo } from './email-verify-token.repository';
import { PasswordResetTokenRepo } from './password-reset-token.repository';
import { UserSettingsRepo } from './user-settings.repository';
import { UsersController } from './users.controller';
import { UsersRepo } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [
    PrismaModule,
    AppConfigModule,
    CryptoModule,
    MailModule,
    SessionsModule,
    forwardRef(() => WorkspacesModule),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepo,
    AuthCredentialsRepo,
    EmailVerifyTokenRepo,
    PasswordResetTokenRepo,
    UserSettingsRepo,
    EmailChangeTokenRepo,
  ],
  exports: [UsersService],
})
export class UsersModule {}
