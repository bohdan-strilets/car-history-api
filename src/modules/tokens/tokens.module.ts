import { AppConfigModule } from '@config/config.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { TokensService } from './tokens.service';

@Module({
  imports: [AppConfigModule, JwtModule.register({})],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
