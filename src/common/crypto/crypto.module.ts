import { AppConfigModule } from '@config/config.module';
import { Global, Module } from '@nestjs/common';

import { CryptoService } from './crypto.service';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
