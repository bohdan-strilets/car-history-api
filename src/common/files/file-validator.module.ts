import { AppConfigModule } from '@config/config.module';
import { Module } from '@nestjs/common';

import { FileValidatorService } from './file-validator.service';

@Module({
  imports: [AppConfigModule],
  providers: [FileValidatorService],
  exports: [FileValidatorService],
})
export class FileValidatorModule {}
