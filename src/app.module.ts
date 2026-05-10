import { CryptoModule } from '@common/crypto';
import { Module } from '@nestjs/common';

import { AppConfigModule } from './config';

@Module({
  imports: [AppConfigModule, CryptoModule],
})
export class AppModule {}
