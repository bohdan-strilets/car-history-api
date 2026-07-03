import { AppConfigModule } from '@config/config.module';
import { Module } from '@nestjs/common';

import { CloudinaryService } from './cloudinary.service';

@Module({
  imports: [AppConfigModule],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
