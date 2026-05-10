import { CryptoModule } from '@common/crypto';
import { TokensModule } from '@modules/tokens';
import { Module } from '@nestjs/common';

import { AppConfigModule } from './config';

@Module({
  imports: [AppConfigModule, CryptoModule, TokensModule],
})
export class AppModule {}
