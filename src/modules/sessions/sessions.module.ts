import { CryptoModule } from '@common/crypto';
import { AppConfigModule } from '@config/config.module';
import { TokensModule } from '@modules/tokens/tokens.module';
import { Module } from '@nestjs/common';

import { SessionsRepository } from './sessions.repository';
import { SessionsService } from './sessions.service';

@Module({
  imports: [TokensModule, CryptoModule, AppConfigModule],
  providers: [SessionsService, SessionsRepository],
  exports: [SessionsService],
})
export class SessionsModule {}
