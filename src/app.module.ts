import { CryptoModule } from '@common/crypto';
import { TokensModule } from '@modules/tokens';
import { Module } from '@nestjs/common';

import { AppConfigModule } from './config';
import { PrismaModule } from './prisma';

@Module({
  imports: [AppConfigModule, PrismaModule, CryptoModule, TokensModule],
})
export class AppModule {}
