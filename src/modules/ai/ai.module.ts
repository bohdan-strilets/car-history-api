import { AppConfigModule } from '@config/config.module';
import { Module } from '@nestjs/common';

import { AiService } from './ai.service';

@Module({
  imports: [AppConfigModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
