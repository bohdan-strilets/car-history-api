import { CryptoModule } from '@common/crypto';
import { AuthModule } from '@modules/auth';
import { MailModule } from '@modules/mail';
import { SessionsModule } from '@modules/sessions';
import { TokensModule } from '@modules/tokens';
import { UsersModule } from '@modules/users';
import { WorkspacesModule } from '@modules/workspaces';
import { Module } from '@nestjs/common';

import { AppConfigModule } from './config';
import { PrismaModule } from './prisma';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    CryptoModule,
    TokensModule,
    UsersModule,
    SessionsModule,
    AuthModule,
    MailModule,
    WorkspacesModule,
  ],
})
export class AppModule {}
