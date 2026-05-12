import { AppConfigModule } from '@config/config.module';
import { Global, Module } from '@nestjs/common';

import { MailService } from './mail.service';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
