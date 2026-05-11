import { CryptoModule } from '@common/crypto';
import { TokensModule } from '@modules/tokens';
import { UsersModule } from '@modules/users';
import { Module } from '@nestjs/common';

import { AppConfigModule } from './config';
import { PrismaModule } from './prisma';

@Module({
  imports: [AppConfigModule, PrismaModule, CryptoModule, TokensModule, UsersModule],
})
export class AppModule {}
