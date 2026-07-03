import { FileValidatorModule } from '@common/files';
import { AppConfigModule } from '@config/config.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { CloudinaryModule } from './cloudinary';
import { MediaGalleryController } from './media-gallery.controller';
import { MediaController } from './media.controller';
import { MediaRepository } from './media.repository';
import { MediaService } from './media.service';

@Module({
  imports: [PrismaModule, CloudinaryModule, FileValidatorModule, AppConfigModule],
  controllers: [MediaController, MediaGalleryController],
  providers: [MediaService, MediaRepository],
  exports: [MediaService],
})
export class MediaModule {}
